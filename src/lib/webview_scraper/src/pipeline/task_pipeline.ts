import PipelineStep from "./pipeline_step.ts";
import Context from "../context";
import {InjectionResult, ParametersWithoutContext, TaskWithContextFn} from "../injection.ts";
import {WebviewWindow} from "@tauri-apps/api/window";
import {UnlistenFn} from "@tauri-apps/api/event";
import * as steps from "./steps";

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
    private readonly _on_state_change?: OnPipelineStateChangeCallback;
    private readonly _steps: PipelineStep[] = [];
    private _window_close_unlisten: UnlistenFn | null = null;
    private _cancel: (() => void) | null = null;

    constructor(target: WebviewWindow, on_state_change?: OnPipelineStateChangeCallback) {
        this._target = target;
        this._on_state_change = on_state_change;
    }

    public execute(on_complete?: OnCompleteCallback): CancelFn {
        this._target.once("tauri://destroyed", () => {
            this._cancel?.();
        }).then(unlisten => {
            this._window_close_unlisten = unlisten;
            this._on_state_change?.(PipelineState.RUNNING);
            this._execute_steps().then(() => {
                on_complete?.();
                this._on_state_change?.(PipelineState.DONE);
            }).catch(e => {
                if ((e as Error | undefined)?.name !== "CancelledError") throw e;
                this._on_state_change?.(PipelineState.CANCELLED);
            });
        });

        return () => this._cancel?.();
    }

    private async _execute_steps(): Promise<void> {
        let cancelled = false;
        for (let step of this._steps) {
            this._cancel = () => {
                try {
                    step.cancel();
                } catch (e) {
                    if ((e as Error | undefined)?.name !== "CancelledError") throw e;
                    cancelled = true;
                }
                this._window_close_unlisten?.();
                this._window_close_unlisten = null;
                this._cancel = null;
                this._on_state_change?.(PipelineState.CANCELLED);
            }

            if (cancelled) break;

            await step.execute(this._target);
        }

        this._window_close_unlisten?.();
        this._window_close_unlisten = null;
        this._cancel = null;
    }

    public navigate_to(url: string, url_pattern?: string): TaskPipeline {
        this._steps.push(new steps.Navigate(url, url_pattern));
        return this;
    }

    public wait_for_url(url_pattern: string): TaskPipeline {
        this._steps.push(new steps.UrlWait(url_pattern));
        return this;
    }

    public navigate_with_click(selector: string, url_pattern: string): TaskPipeline {
        this._steps.push(
            new steps.Task((selector: string) => {
                const element = document.querySelector(selector);
                if (typeof element === "undefined" || element === null) {
                    throw new Error(`Element not found: ${selector}`);
                }
                (element as HTMLElement).click();
            }, [selector])
        );
        this._steps.push(new steps.UrlWait(url_pattern));
        return this;
    }

    public task<F extends (...args: Parameters<F>) => ReturnType<F>>(
        injected_fn: F,
        args: Parameters<F>,
        on_result?: (result: InjectionResult<ReturnType<F>>) => void,
    ): TaskPipeline {
        this._steps.push(new steps.Task(injected_fn, args, on_result));
        return this;
    }

    public task_with_context<Ctx extends Context, F extends (...args: any[]) => any>(
        context_ctor: new () => Ctx,
        injected_fn: TaskWithContextFn<Ctx, F>,
        args: ParametersWithoutContext<F>,
        on_result?: (result: InjectionResult<ReturnType<F>>) => void,
    ): TaskPipeline {
        this._steps.push(new steps.TaskWithContext<Ctx, F>(context_ctor, injected_fn, args, on_result));
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
}

export {PipelineState};
export type {OnPipelineStateChangeCallback};
export default TaskPipeline;
