import {WebScraper} from "../web_scraper.ts";
import {PipelineStep} from "./pipeline_step.ts";
import {Context} from "../context.ts";
import {Navigate} from "./steps/navigate.ts";
import {UrlWait} from "./steps/url_wait.ts";
import {Task} from "./steps/task.ts";
import {InjectionResult} from "../injection.ts";
import {WebviewWindow} from "@tauri-apps/api/window";
import {UnlistenFn} from "@tauri-apps/api/event";

const noop = () => {
}
type OnCompleteCallback = () => void;

export class TaskPipeline<Ctx extends Context> {
    private readonly _web_scraper: WebScraper<Ctx>;
    private readonly _steps: PipelineStep[] = [];
    private _window_close_unlisten: UnlistenFn | null = null;
    private _cancel: (() => void) | null = null;

    constructor(web_scraper: WebScraper<Ctx>) {
        this._web_scraper = web_scraper;
    }

    public execute(
        target: WebviewWindow,
        on_complete: OnCompleteCallback = noop
    ): () => void {
        target.listen("tauri://destroyed", () => {
            this._cancel?.();
        }).then(unlisten => {
            this._window_close_unlisten = unlisten;
            this._execute_steps(target).then(() => on_complete());
        });

        return () => this._cancel?.();
    }

    private async _execute_steps(target: WebviewWindow): Promise<void> {
        const context = this._web_scraper.context_factory.create();

        for (let step of this._steps) {
            this._cancel = () => {
                step.cancel();
                this._window_close_unlisten?.();
            }
            await step.execute(target, context);
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
        on_result: (result: InjectionResult<ReturnType<F>>) => void = noop,
    ): TaskPipeline<Ctx> {
        this._steps.push(new Task(injected_fn, args, on_result));
        return this;
    }
}