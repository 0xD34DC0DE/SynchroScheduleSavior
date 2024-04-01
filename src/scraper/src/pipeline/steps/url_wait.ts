import {Context} from "../../context.ts";
import {PipelineStep} from "../pipeline_step.ts";
import {WebviewWindow} from "@tauri-apps/api/window";
import UrlPattern from "url-pattern";

export class UrlWait<Ctx extends Context> extends PipelineStep {
    private readonly url_pattern: UrlPattern;

    public readonly name: string = "UrlWait";

    constructor(url_pattern: string) {
        super();
        this.url_pattern = new UrlPattern(url_pattern);
    }

    public async run(target: WebviewWindow, _context: Ctx): Promise<void> {
        await this.add_listener(target.listen<{ url: string }>(
            "navigation",
            (event) => {
                if (this.url_pattern.match(event.payload.url)) this.complete();
            }
        ));
    }
}