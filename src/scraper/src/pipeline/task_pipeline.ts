import {PipelineStep} from "./pipeline_step.ts";
import {Context, ContextFactory} from "../context.ts";
import {Navigate} from "./steps/navigate.ts";
import {UrlWait} from "./steps/url_wait.ts";
import {Task} from "./steps/task.ts";
import {InjectionResult} from "../injection.ts";
import {WebviewWindow} from "@tauri-apps/api/window";
import {UnlistenFn} from "@tauri-apps/api/event";

type OnCompleteCallback = () => void;
type CancelFn = () => void;

export enum PipelineState {
    RUNNING= "running",
    DONE = "done",
    CANCELLED = "cancelled",
}

type OnPipelineStateChangeCallback = (state: PipelineState) => void;

export class TaskPipeline<Ctx extends Context> {
    private readonly _target: WebviewWindow;
    private readonly _context_factory: ContextFactory<Ctx>;
    private _on_state_change?: OnPipelineStateChangeCallback;
    private readonly _steps: PipelineStep[] = [];
    private _window_close_unlisten: UnlistenFn | null = null;
    private _cancel: (() => void) | null = null;

    constructor(target: WebviewWindow, context_factory: ContextFactory<Ctx>) {
        this._target = target;
        this._context_factory = context_factory;
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
        const context = this._context_factory.create();

        for (let step of this._steps) {
            this._cancel = () => {
                step.cancel();
                this._window_close_unlisten?.();
                this._window_close_unlisten = null;
                this._cancel = null;
                this._on_state_change?.(PipelineState.CANCELLED);
            }
            await step.execute(this._target, context);
        }

        this._window_close_unlisten?.();
        this._window_close_unlisten = null;
        this._cancel = null;
    }

    public navigate_to(url: string, url_pattern?: string): TaskPipeline<Ctx> {
        this._steps.push(new Navigate(url, url_pattern));
        return this;
    }

    public wait_for_url(url_pattern: string): TaskPipeline<Ctx> {
        this._steps.push(new UrlWait(url_pattern));
        return this;
    }

    public task<F extends (...args: Parameters<F>) => ReturnType<F>>(
        injected_fn: F,
        args: Parameters<F>,
        on_result?: (result: InjectionResult<ReturnType<F>>) => void,
    ): TaskPipeline<Ctx> {
        this._steps.push(new Task(injected_fn, args, on_result));
        return this;
    }
}