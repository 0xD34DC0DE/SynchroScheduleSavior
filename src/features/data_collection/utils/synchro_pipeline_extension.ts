import {
    OnPipelineErrorCallback,
    OnPipelineStateChangeCallback,
    Selector,
    SelectorType,
    TaskPipeline
} from "../../../lib/webview_scraper";
import {WebviewWindow} from "@tauri-apps/api/window";

class SynchroPipelineExtension extends TaskPipeline {
    private static readonly _loader_config = {
        selector: new Selector("div.gh-loader-popup"),
        observer_config: {attributes: true, attributeFilter: ['class'], attributeOldValue: true}
    };
    private static readonly _loader_condition = (mutation: MutationRecord) => {
        return (mutation.oldValue?.includes("show") ?? false) &&
            !(mutation.target as HTMLElement).classList.contains("show");
    };

    constructor(
        target: WebviewWindow,
        on_state_change?: OnPipelineStateChangeCallback,
        on_error?: OnPipelineErrorCallback) {
        super(target, on_state_change, on_error);
    }

    public click_and_wait_for_loader<T extends HTMLElement>(selector: SelectorType<T>): this {
        return this.click_and_wait(
            selector,
            SynchroPipelineExtension._loader_condition,
            SynchroPipelineExtension._loader_config
        );
    }
}

export default SynchroPipelineExtension;