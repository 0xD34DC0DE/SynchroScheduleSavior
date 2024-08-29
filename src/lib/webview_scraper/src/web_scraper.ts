import TaskPipeline, {OnPipelineStateChangeCallback, TaskPipelineExtension} from "./pipeline/task_pipeline.ts";
import {WebviewWindow} from "@tauri-apps/api/window";
import {get_window_by_label, open_webview} from "./commands.ts";
import {UnlistenFn} from "@tauri-apps/api/event";
import {PipelineStepsBuilder, UrlPattern} from "./pipeline/steps";
import {default as UrlPatternMatcher} from "url-pattern";

type DestroyCallback = () => void;

class WebScraper {
    private readonly _destroy_listener: Promise<UnlistenFn>;
    private readonly _navigation_listener: Promise<UnlistenFn>;
    private readonly _destroy_callbacks: DestroyCallback[] = [];
    private _target: WebviewWindow | null;
    private readonly _on_page_load_pipelines: OnPageLoadPipeline[];


    static async create(label: string,
                        title: string,
                        url: string,
                        onPageLoadPipelines: OnPageLoadPipeline[] = []
    ): Promise<WebScraper> {
        //FIXME: getByLabel is broken, it doesn't return existing windows after a page reload
        // https://github.com/tauri-apps/tauri/issues/5380
        // For now, get_window_by_label is a workaround
        const existing_window = await get_window_by_label(label);
        if (existing_window) {
            return new WebScraper(existing_window, onPageLoadPipelines);
        }

        await open_webview(label, title, url);
        const target = WebviewWindow.getByLabel(label);
        if (target === null) {
            throw new Error(`Could not find window with label: ${label}`);
        }

        const scraper = new WebScraper(target, onPageLoadPipelines);

        //FIXME: This is a workaround for a race condition causing the the window to freeze during loading.
        // "navigation" event reused as a signal that the window has finished loading since 'tauri://created' is
        // a native event and native events are part of the problem.
        // https://github.com/tauri-apps/tauri/issues/10256
        await new Promise<void>(resolve => {
            target.once("navigation", () => resolve());
        });
        await target.show();

        return scraper
    }

    private constructor(target: WebviewWindow, onPageLoadPipelines: OnPageLoadPipeline[]) {
        this._target = target;
        this._on_page_load_pipelines = onPageLoadPipelines;

        this._navigation_listener = this.getNavigationListener();

        this._destroy_listener = this._target.once("tauri://destroyed", () => {
            this._target = null;
            this._destroy_callbacks.forEach(callback => callback());
        });
    }

    private getNavigationListener() {
        if (!this._target) throw new Error("Window has been destroyed");

        return this._target.listen<{ url: string }>("navigation", (event) => {
            if (!this._target) return;
            for (let pipeline of this._on_page_load_pipelines) {

                let url_patten_matcher: UrlPatternMatcher;
                try {
                    url_patten_matcher = pipeline.url_pattern instanceof RegExp
                        ? new UrlPatternMatcher(pipeline.url_pattern)
                        : new UrlPatternMatcher(pipeline.url_pattern);
                } catch (e) {
                    console.error("Error while creating UrlPatternMatcher", e);
                    continue;
                }

                if (!url_patten_matcher.match(event.payload.url)) continue;

                pipeline.pipelineSteps(new TaskPipeline(this._target)).execute(() => {
                    console.log("Pipeline done for", event.payload.url);
                });
            }
        });
    }

    public begin(on_state_change?: OnPipelineStateChangeCallback): TaskPipeline;
    public begin<T extends TaskPipeline>(
        on_state_change?: OnPipelineStateChangeCallback,
        extension?: TaskPipelineExtension<T>
    ): T;
    public begin<T extends TaskPipeline = TaskPipeline>(
        on_state_change?: OnPipelineStateChangeCallback,
        extension?: TaskPipelineExtension<T>
    ): T | TaskPipeline {
        if (!this._target) throw new Error("Window has been destroyed");
        if (extension) {
            if (!(extension.prototype instanceof TaskPipeline)) {
                throw new Error("Extension must be a subclass of TaskPipeline");
            }
            return new extension(this._target, on_state_change);
        }
        return new TaskPipeline(this._target, on_state_change);
    }

    /**
     * Register a callback to be called when the window is destroyed.
     *
     * @param callback callbacks are called when the window is closed unexpectedly, such as when the window is closed
     * from the window manager. The callback will not be called if the window is closed by calling the {@link close}
     * method
     */
    public onDestroy(callback: DestroyCallback): void {
        this._destroy_callbacks.push(callback);
    }

    /**
     * Close the scraper and the window it controls. Using this method to close the window won't trigger the onDestroy
     * callbacks.
     */
    public async close(): Promise<void> {
        (await this._destroy_listener)(); // Remove the listener to not trigger the onDestroy callbacks
        (await this._navigation_listener)();
        await this._target?.close();
    }
}

type OnPageLoadPipeline = {
    pipelineSteps: PipelineStepsBuilder
    url_pattern: UrlPattern;
};

export type {OnPageLoadPipeline};
export default WebScraper;
