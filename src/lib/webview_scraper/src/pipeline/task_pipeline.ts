import PipelineStep from "./pipeline_step.ts";
import {InjectionResult} from "../injection.ts";
import {WebviewWindow} from "@tauri-apps/api/window";
import {UnlistenFn} from "@tauri-apps/api/event";
import * as steps from "./steps";
import {HTMLElementProxy} from "../stubs/html_element.ts";
import {Selector} from "../stubs";
import {InjectedArgs, InjectedFunction,} from "../stubs/remote_object.ts";

type OnCompleteCallback = () => void;
type CancelFn = () => void;

enum PipelineState {
    IDLE = "idle",
    RUNNING = "running",
    DONE = "done",
    CANCELLED = "cancelled",
}

type OnPipelineStateChangeCallback = (state: PipelineState) => void;

class TaskPipeline {
    private readonly _target: WebviewWindow;
    private _pipeline_state: PipelineState = PipelineState.IDLE;
    private readonly _on_state_change?: OnPipelineStateChangeCallback;
    private readonly _steps: PipelineStep[] = [];
    private _currently_executing_step: PipelineStep | null = null;
    private _window_close_unlisten: UnlistenFn | null = null;

    constructor(target: WebviewWindow, on_state_change?: OnPipelineStateChangeCallback) {
        this._target = target;
        this._on_state_change = on_state_change;
    }

    public execute(on_complete?: OnCompleteCallback): CancelFn {
        this._target.once("tauri://destroyed", () => {
            this._cancel_execution();
        }).then(async unlisten => {
            this._window_close_unlisten = unlisten;
            await this._execute_steps();
            on_complete?.();
        }).catch(e => {
            if ((e as Error | undefined)?.name !== "CancelledError") throw e;
        });

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

        this._window_close_unlisten?.();
        this._window_close_unlisten = null;

        this._set_pipeline_state(PipelineState.DONE);
    }

    private _set_pipeline_state(state: PipelineState): void {
        this._pipeline_state = state;
        this._on_state_change?.(state);
    }

    private async _execute_step(step: PipelineStep): Promise<void> {
        this._currently_executing_step = step;
        await step.execute(this._target).then(() => {
            this._currently_executing_step = null;
        });
    }

    private _cancel_execution(): void {
        if (this._pipeline_state === PipelineState.CANCELLED ||
            this._pipeline_state === PipelineState.DONE) return;

        this._currently_executing_step?.cancel();

        this._window_close_unlisten?.();
        this._window_close_unlisten = null;

        this._set_pipeline_state(PipelineState.CANCELLED);
    }

    public navigate_to(url: string, url_pattern?: string | RegExp): TaskPipeline {
        this._steps.push(new steps.Navigate(url, url_pattern));
        return this;
    }

    public wait_for_url(url_pattern: string | RegExp): TaskPipeline {
        this._steps.push(new steps.UrlWait(url_pattern));
        return this;
    }

    public navigate_with_click<T extends HTMLElement>(
        selector: string | HTMLElementProxy<T>,
        url_pattern: string
    ): TaskPipeline {
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
    ): TaskPipeline {
        this._steps.push(new steps.Task(injected_fn, args, on_result));
        return this;
    }

    public wait_for_any_events(target_window: "current" | "target",
                               event_names: string[],
                               on_complete?: OnCompleteCallback): TaskPipeline {
        this._steps.push(new steps.EventWait(target_window, "any", event_names, on_complete));
        return this;
    }

    public wait_for_event(target_window: "current" | "target",
                          event_name: string,
                          on_complete?: OnCompleteCallback): TaskPipeline {
        this._steps.push(new steps.EventWait(target_window, "any", [event_name], on_complete));
        return this;
    }

    public wait_for_all_events(target_window: "current" | "target",
                               event_names: string[],
                               on_complete?: OnCompleteCallback): TaskPipeline {
        this._steps.push(new steps.EventWait(target_window, "all", event_names, on_complete));
        return this;
    }

    public callback(callback: OnCompleteCallback): TaskPipeline {
        this._steps.push(new steps.Callback(callback));
        return this;
    }

    public click_and_wait<T extends HTMLElement>(
        selector: string | HTMLElementProxy<T>,
        condition: steps.ConditionCallback,
        wait_config: steps.ConditionConfig<T>
    ): TaskPipeline {
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
        sub_pipeline: (element: HTMLElementProxy<T>, pipeline: TaskPipeline) => TaskPipeline
    ) {
        this._steps.push(
            new steps.ForEachTask<T>(
                selector,
                (element, on_complete) => {
                    sub_pipeline(
                        element,
                        new TaskPipeline(this._target, this._on_state_change)
                    ).execute(on_complete);
                }
            )
        );
        return this;
    }
}

export {PipelineState};
export type {OnPipelineStateChangeCallback};
export default TaskPipeline;
