import PipelineStep from "../pipeline_step.ts";
import {WebviewWindow} from "@tauri-apps/api/window";
import {default as UrlPatternMatcher} from "url-pattern";
import {UrlPattern} from "./types.ts";

class UrlWait extends PipelineStep {
    private readonly url_pattern: UrlPatternMatcher;

    public readonly name: string = "UrlWait";

    constructor(url_pattern: UrlPattern) {
        super();
        if (url_pattern instanceof RegExp)
            this.url_pattern = new UrlPatternMatcher(url_pattern);
        else
            this.url_pattern = new UrlPatternMatcher(url_pattern);
    }

    public async run(target: WebviewWindow): Promise<void> {
        await this.add_listener(target.listen<{ url: string }>(
            "navigation",
            (event) => {
                if (this.url_pattern.match(event.payload.url)) this.complete();
            }
        ));
    }
}

export default UrlWait;
