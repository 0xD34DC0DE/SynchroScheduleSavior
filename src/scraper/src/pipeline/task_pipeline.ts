import {PipelineStep} from "./pipeline_step.ts";
import {Context} from "../context.ts";
import {Navigate} from "./steps/navigate.ts";
import {UrlWait} from "./steps/url_wait.ts";
import {Task} from "./steps/task.ts";
import {InjectionResult, ParametersWithoutContext, TaskWithContextFn} from "../injection.ts";
import {WebviewWindow} from "@tauri-apps/api/window";
import {UnlistenFn} from "@tauri-apps/api/event";
import {TaskWithContext} from "./steps/task_with_context.ts";
import {EventWait} from "./steps/event_wait.ts";

type OnCompleteCallback = () => void;
type CancelFn = () => void;

export enum PipelineState {
    RUNNING = "running",
    DONE = "done",
    CANCELLED = "cancelled",
}

type OnPipelineStateChangeCallback = (state: PipelineState) => void;

export class TaskPipeline {
    private readonly _target: WebviewWindow;
    private _on_state_change?: OnPipelineStateChangeCallback;
    private readonly _steps: PipelineStep[] = [];
    private _window_close_unlisten: UnlistenFn | null = null;
    private _cancel: (() => void) | null = null;

    constructor(target: WebviewWindow) {
        this._target = target;
    }

    public execute(on_complete?: OnCompleteCallback, on_state_change?: OnPipelineStateChangeCallback): CancelFn {
        this._on_state_change = on_state_change;
        this._target.once("tauri://destroyed", () => {
            this._cancel?.();
        }).then(unlisten => {
            this._window_close_unlisten = unlisten;
            this._on_state_change?.(PipelineState.RUNNING);
            this._execute_steps().then(() => {
                on_complete?.();
                this._on_state_change?.(PipelineState.DONE);
            });
        });

        return () => this._cancel?.();
    }

    private async _execute_steps(): Promise<void> {
        for (let step of this._steps) {
            this._cancel = () => {
                step.cancel();
                this._window_close_unlisten?.();
                this._window_close_unlisten = null;
                this._cancel = null;
                this._on_state_change?.(PipelineState.CANCELLED);
            }
            await step.execute(this._target);
        }

        this._window_close_unlisten?.();
        this._window_close_unlisten = null;
        this._cancel = null;
    }

    public navigate_to(url: string, url_pattern?: string): TaskPipeline {
        this._steps.push(new Navigate(url, url_pattern));
        return this;
    }

    public wait_for_url(url_pattern: string): TaskPipeline {
        this._steps.push(new UrlWait(url_pattern));
        return this;
    }

    public task<F extends (...args: Parameters<F>) => ReturnType<F>>(
        injected_fn: F,
        args: Parameters<F>,
        on_result?: (result: InjectionResult<ReturnType<F>>) => void,
    ): TaskPipeline {
        this._steps.push(new Task(injected_fn, args, on_result));
        return this;
    }

    public task_with_context<Ctx extends Context, F extends (...args: any[]) => any>(
        context_ctor: new () => Ctx,
        injected_fn: TaskWithContextFn<Ctx, F>,
        args: ParametersWithoutContext<F>,
        on_result?: (result: InjectionResult<ReturnType<F>>) => void,
    ): TaskPipeline {
        this._steps.push(new TaskWithContext<Ctx, F>(context_ctor, injected_fn, args, on_result));
        return this;
    }

    public wait_for_any_events(target_window: "current" | "target",
                               event_names: string[],
                               on_complete?: OnCompleteCallback): TaskPipeline {
        this._steps.push(new EventWait(target_window, "any", event_names, on_complete));
        return this;
    }

    public wait_for_event(target_window: "current" | "target",
                          event_name: string,
                          on_complete?: OnCompleteCallback): TaskPipeline {
        this._steps.push(new EventWait(target_window, "any", [event_name], on_complete));
        return this;
    }

    public wait_for_all_events(target_window: "current" | "target",
                               event_names: string[],
                               on_complete?: OnCompleteCallback): TaskPipeline {
        this._steps.push(new EventWait(target_window, "all", event_names, on_complete));
        return this;
    }
}