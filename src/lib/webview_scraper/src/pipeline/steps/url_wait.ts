import PipelineStep from "../pipeline_step.ts";
import {WebviewWindow} from "@tauri-apps/api/window";
import UrlPattern from "url-pattern";

class UrlWait extends PipelineStep {
    private readonly url_pattern: UrlPattern;

    public readonly name: string = "UrlWait";

    constructor(url_pattern: string) {
        super();
        this.url_pattern = new UrlPattern(url_pattern);
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
