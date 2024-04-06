import {PipelineStep} from "../pipeline_step.ts";
import {WebviewWindow} from "@tauri-apps/api/window";
import UrlPattern from "url-pattern";
import {Injection} from "../../injection.ts";

class Navigate extends PipelineStep {
    private readonly _url: string;
    private readonly _url_pattern: UrlPattern;

    public readonly name: string = "Navigate";

    constructor(
        url: string,
        url_pattern?: string
    ) {
        super();
        this._url = url;
        this._url_pattern = new UrlPattern(url_pattern || url);
    }

    public async run(target: WebviewWindow): Promise<void> {
        await this.add_listener(target.listen<{ url: string }>(
            "navigation",
            (event) => {
                if (this._url_pattern.match(event.payload.url)) this.complete();
            }
        ));

        const injection = new Injection(
            (href: string) => window.location.href = href,
            [this._url],
        );

        await this.add_listener(injection.inject(target));
    }
}

export {Navigate};