import {Context} from "../../context.ts";
import {InjectableWindow} from "../../window.ts";
import {PipelineStep} from "../pipeline_step.ts";
import UrlPattern from "url-pattern";

class Navigate<Ctx extends Context> extends PipelineStep<Ctx> {
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

    public async run(target_window: InjectableWindow, context: Ctx): Promise<Ctx> {
        console.log("(PipelineStep::Navigate) running");
        return this.begin(
            context,
            target_window.on_navigation(url => {
                console.log("(PipelineStep::Navigate) on_navigation: ", url);
                if (this._url_pattern.match(url)) this.complete();
            }),
            () => {
                console.log("(PipelineStep::Navigate) navigating to: ", this._url);
                target_window.inject(
                    (href: string) => window.location.href = href,
                    [this._url],
                )
            }
        );
    }
}

export {Navigate};