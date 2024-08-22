import TaskPipeline, {OnPipelineStateChangeCallback, TaskPipelineExtension} from "./pipeline/task_pipeline.ts";
import {WebviewWindow} from "@tauri-apps/api/window";
import {get_window_by_label, open_webview} from "./commands.ts";
import {UnlistenFn} from "@tauri-apps/api/event";

type DestroyCallback = () => void;

class WebScraper {
    private readonly _destroy_listener: Promise<UnlistenFn>;
    private readonly _destroy_callbacks: DestroyCallback[] = [];
    private _target: WebviewWindow | null;

    static async create(label: string, title: string, url: string): Promise<WebScraper> {
        //FIXME: getByLabel is broken, it doesn't return existing windows after a page reload
        // https://github.com/tauri-apps/tauri/issues/5380
        // For now, get_window_by_label is a workaround
        const existing_window = await get_window_by_label(label);
        if (existing_window) {
            return new WebScraper(existing_window);
        }

        await open_webview(label, title, url);
        const target = WebviewWindow.getByLabel(label);
        if (target === null) {
            throw new Error(`Could not find window with label: ${label}`);
        }

        //FIXME: This is a workaround for a race condition causing the the window to freeze during loading.
        // "navigation" event reused as a signal that the window has finished loading since 'tauri://created' is
        // a native event and native events are part of the problem.
        // https://github.com/tauri-apps/tauri/issues/10256
        await new Promise<void>(resolve => {
            target.once("navigation", () => resolve());
        });
        await target.show();

        return new WebScraper(target);
    }

    private constructor(target: WebviewWindow) {
        this._target = target;
        this._destroy_listener = this._target.once("tauri://destroyed", () => {
            this._target = null;
            this._destroy_callbacks.forEach(callback => callback());
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
        const unlisten = await this._destroy_listener;
        unlisten(); // Remove the listener to not trigger the onDestroy callbacks
        await this._target?.close();
    }
}

export default WebScraper;
