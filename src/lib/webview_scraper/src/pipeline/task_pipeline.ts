import PipelineStep, {CancelledPipelineStepError} from "./pipeline_step.ts";
import {InjectionResult} from "../injection.ts";
import {WebviewWindow} from "@tauri-apps/api/window";
import {UnlistenFn} from "@tauri-apps/api/event";
import * as steps from "./steps";
import {HTMLElementProxy, InjectedArgs, InjectedFunction, Selector, SelectorType} from "../stubs";
import {LoggerBgColor, LoggerFgColor, NamespaceConsoleLogger} from "../logger.ts";

type OnCompleteCallback = () => void;
type CancelFn = () => void;

enum PipelineState {
    IDLE = "idle",
    RUNNING = "running",
    DONE = "done",
    CANCELLED = "cancelled",
    ABORTED = "aborted"
}

type OnPipelineStateChangeCallback = (state: PipelineState) => void;
type OnPipelineErrorCallback = (error: any) => void;

const debugBgColorDepth: LoggerBgColor[] = ["bgRed", "bgGreen", "bgYellow", "bgBlue", "bgMagenta", "bgCyan", "bgWhite"];
const debugFgColorDepth: LoggerFgColor[] = ["black", "whiteBright", "black", "whiteBright", "whiteBright", "black", "black"];

class TaskPipeline {
    private readonly _target: WebviewWindow;
    private _pipeline_state: PipelineState = PipelineState.IDLE;
    private readonly _on_state_change?: OnPipelineStateChangeCallback;
    private readonly _on_error?: OnPipelineErrorCallback;
    private readonly _steps: PipelineStep[] = [];
    private _currently_executing_step: PipelineStep | null = null;
    private _window_close_unlisten: UnlistenFn | null = null;
    private readonly _stored_results: Record<string, any>;
    private readonly _parent_pipeline?: TaskPipeline;
    private readonly _depth: number;
    private _name?: string;
    private _logger?: NamespaceConsoleLogger;


    constructor(
        parent_pipeline: TaskPipeline,
    )
    constructor(
        target: WebviewWindow,
        on_state_change?: OnPipelineStateChangeCallback,
        on_error?: OnPipelineErrorCallback
    )
    constructor(
        target_or_pipeline: WebviewWindow | TaskPipeline,
        on_state_change?: OnPipelineStateChangeCallback,
        on_error?: OnPipelineErrorCallback
    ) {
        if (target_or_pipeline instanceof TaskPipeline) {
            this._target = target_or_pipeline._target;
            this._stored_results = target_or_pipeline._stored_results;
            this._parent_pipeline = target_or_pipeline;
            this._depth = target_or_pipeline._depth + 1;
            this._on_error = target_or_pipeline._on_error;
        } else {
            this._target = target_or_pipeline;
            this._stored_results = {};
            this._depth = 0;
            this._on_state_change = on_state_change;
            this._on_error = on_error;
        }
    }

    public execute(
        on_complete?: OnCompleteCallback,
        on_error?: (error: any) => void
    ): CancelFn {
        this._target.once("tauri://destroyed", () => {
            this._cancel_execution();
        }).then(async unlisten => {
            this._window_close_unlisten = unlisten;
            await this._execute_steps();
            on_complete?.();
        }).catch(on_error);

        return () => this._cancel_execution();
    }

    private async _execute_steps(): Promise<void> {
        if (this._pipeline_state !== PipelineState.IDLE) return;
        this._set_pipeline_state(PipelineState.RUNNING);

        for (let step of this._steps) {
            // TypeScript marks this as an unintentional comparison since the state is set to RUNNING just before
            // (but the value can change since it's running in a different asynchronous context)
            // @ts-expect-error
            if (this._pipeline_state !== PipelineState.RUNNING) return;
            await this._execute_step(step);
        }
        if (!this._is_stopped()) this._finish(PipelineState.DONE);
    }

    private _set_pipeline_state(state: PipelineState): void {
        this._pipeline_state = state;
        this._on_state_change?.(state);
    }

    private async _execute_step(step: PipelineStep): Promise<void> {
        this._currently_executing_step = step;
        this.logger.info(`Executing step: ${step.name}`);

        try {
            await step.execute(this._target);
        } catch (e) {
            if (e instanceof CancelledPipelineStepError) {
                this._cancel_execution();
            } else {
                this._abort_execution(e);
            }
            return;
        }

        this.logger.info(`Step executed: ${step.name}`);

        this._currently_executing_step = null;
    }

    private _cancel_execution(): void {
        if (this._is_stopped()) return;

        if (this._currently_executing_step?.is_running()) {
            this._currently_executing_step?.cancel();
        }

        this._finish(PipelineState.CANCELLED);
    }

    private _abort_execution(error: any): void {
        if (this._is_stopped()) return;

        if (this._currently_executing_step?.is_running()) {
            this._currently_executing_step?.abort(error);
        }

        if (error) {
            this.logger.error(error);
            this._on_error?.(error);
        }

        this._parent_pipeline?._abort_execution(undefined);

        this._finish(PipelineState.ABORTED);
    }

    private _is_stopped(): boolean {
        return [PipelineState.CANCELLED, PipelineState.ABORTED, PipelineState.DONE].includes(this._pipeline_state);
    }

    private _finish(final_state: PipelineState): void {
        this._window_close_unlisten?.();
        this._window_close_unlisten = null;
        this._set_pipeline_state(final_state);
    }

    protected sub_pipeline(): this {
        return new (Object.getPrototypeOf(this).constructor)(this);
    }

    protected execute_sub_pipeline(
        sub_pipeline: this,
        on_complete?: OnCompleteCallback,
        on_error?: (error: any) => void
    ): void {
        sub_pipeline.execute(on_complete, on_error);
    }

    public get logger(): NamespaceConsoleLogger {
        if (this._logger) return this._logger;
        if (this._parent_pipeline) {
            this._logger = this._parent_pipeline.logger.extend(
                this._name ?? this._currently_executing_step?.name ?? "unknown",
                debugFgColorDepth[this._depth],
                debugBgColorDepth[this._depth]
            );
            return this._logger;
        }
        return new NamespaceConsoleLogger(
            this._currently_executing_step?.name ?? "unknown",
            debugFgColorDepth[this._depth],
            debugBgColorDepth[this._depth]
        );
    }

    public navigate_to(url: string, url_pattern?: steps.UrlPattern): this {
        this._steps.push(new steps.Navigate(url, url_pattern));
        return this;
    }

    public wait_for_url(url_pattern: steps.UrlPattern): this {
        this._steps.push(new steps.UrlWait(url_pattern));
        return this;
    }

    public navigate_with_click<T extends HTMLElement>(
        selector: SelectorType<T>,
        url_pattern: string
    ): this {
        this._steps.push(
            new steps.Task(
                (element: HTMLElement) => element.click(),
                [new Selector<HTMLElement>(selector)]
            )
        );
        this._steps.push(new steps.UrlWait(url_pattern));
        return this;
    }

    public task<Args extends [...any], Params extends [...any]>(
        injected_fn: InjectedFunction<Params, Args>,
        args: InjectedArgs<Args, Params>,
        on_result?: (result: InjectionResult<ReturnType<InjectedFunction<Params, Args>>>) => void,
    ): this {
        this._steps.push(new steps.Task(injected_fn, args, on_result));
        return this;
    }

    public wait_for_any_events(target_window: steps.EventWaitTarget,
                               event_names: string[],
                               on_complete?: OnCompleteCallback): this {
        this._steps.push(new steps.EventWait(target_window, "any", event_names, on_complete));
        return this;
    }

    public wait_for_event(target_window: steps.EventWaitTarget,
                          event_name: string,
                          on_complete?: OnCompleteCallback): this {
        this._steps.push(new steps.EventWait(target_window, "any", [event_name], on_complete));
        return this;
    }

    public wait_for_all_events(target_window: steps.EventWaitTarget,
                               event_names: string[],
                               on_complete?: OnCompleteCallback): this {
        this._steps.push(new steps.EventWait(target_window, "all", event_names, on_complete));
        return this;
    }

    public callback(callback: OnCompleteCallback): this {
        this._steps.push(new steps.Callback(callback));
        return this;
    }

    public click_and_wait<T extends HTMLElement>(
        selector: SelectorType<T>,
        condition: steps.ConditionCallback,
        wait_config: steps.ConditionConfig<T>
    ): this {
        this._steps.push(
            new steps.Task(
                (element: HTMLElement) => element.click(),
                [new Selector<HTMLElement>(selector)]
            )
        );
        this._steps.push(
            new steps.TaskWithCondition(condition, wait_config)
        );
        return this;
    }

    public for_each<T extends HTMLElement>(
        selector: string,
        sub_pipeline: (element: HTMLElementProxy<T>, pipeline: this) => this
    ) {
        this._steps.push(
            new steps.ForEachTask<T>(
                selector,
                (element, on_complete, on_error) => {
                    this.execute_sub_pipeline(
                        sub_pipeline(
                            element,
                            this.sub_pipeline()
                        ),
                        on_complete,
                        on_error
                    );
                }
            )
        );
        return this;
    }

    public while<
        ConditionArgs extends [...any],
        ConditionParams extends [...any]
    >(
        condition_type: steps.WhileConditionType,
        condition_fn: InjectedFunction<ConditionParams, ConditionArgs>,
        condition_args: InjectedArgs<ConditionArgs, ConditionParams>,
        sub_pipeline: (iteration_data: steps.WhileIterationData, pipeline: this) => this,
        config?: steps.WhileTaskConfig
    ): this {
        this._steps.push(
            new steps.WhileTask(
                condition_type,
                condition_fn,
                condition_args,
                (iteration_data, on_complete, on_error) => {
                    this.execute_sub_pipeline(
                        sub_pipeline(
                            iteration_data,
                            this.sub_pipeline()
                        ),
                        on_complete,
                        on_error
                    );
                },
                config
            )
        );
        return this;
    }

    public defer(steps_builder: steps.PipelineStepsBuilder<this>): this {
        this._steps.push(
            new steps.DeferredStep(steps_builder, () => ({
                    pipeline: this.sub_pipeline(),
                    args: []
                })
            )
        );
        return this
    }

    public store_result<R>(
        key: string,
        sub_pipeline: (pipeline: this, set_result: (result: NoInfer<R>, overwrite?: boolean) => void) => this
    ): this {
        this._steps.push(
            new steps.DeferredStep(
                sub_pipeline,
                () => ({
                    pipeline: this.sub_pipeline(),
                    args: [
                        (result: R, overwrite = false) => {
                            if (this._stored_results[key] && !overwrite) {
                                throw new Error(`Result with key ${key} already exists`);
                            }
                            this._stored_results[key] = result;
                        }
                    ] as const,
                })
            )
        );
        return this;
    }

    public with_stored_result<R>(
        key: string,
        sub_pipeline: (pipeline: this, result: NoInfer<R>) => this
    ): this {
        const get_stored_result = () => {
            if (!this._stored_results || !this._stored_results[key]) {
                throw new Error(`Result with key ${key} not found`);
            }
            return this._stored_results[key];
        }

        this._steps.push(
            new steps.DeferredStep(
                sub_pipeline,
                () => ({
                    pipeline: this.sub_pipeline(),
                    args: [get_stored_result()] as const
                })
            )
        );
        return this;
    }

    public set_pipeline_name(name: string): this {
        this._steps.push(new steps.Callback(() => {
                this._logger = undefined;
                this._name = name;
            })
        );
        return this;
    }
}

type TaskPipelineExtension<T extends TaskPipeline> = new (...args: ConstructorParameters<typeof TaskPipeline>) => T;

export {PipelineState};
export type {OnPipelineStateChangeCallback, OnPipelineErrorCallback, TaskPipelineExtension};
export default TaskPipeline;
