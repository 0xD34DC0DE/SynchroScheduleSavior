import {Context} from "../../context.ts";
import {InjectableWindow} from "../../window.ts";
import {PipelineStep} from "../pipeline_step.ts";
import UrlPattern from "url-pattern";

class UrlWait<Ctx extends Context> extends PipelineStep<Ctx> {
    private readonly url_pattern: UrlPattern;

    public readonly name: string = "UrlWait";

    constructor(url_pattern: string) {
        super();
        this.url_pattern = new UrlPattern(url_pattern);
    }

    public async run(
        target_window: InjectableWindow,
        context: Ctx
    ): Promise<Ctx> {
        console.log("(PipelineStep::UrlWait) running");
        return this.begin(
            context,
            target_window.on_navigation(url => {
                console.log("(PipelineStep::UrlWait) on_navigation: ", url);
                if (this.url_pattern.match(url)) {
                    console.log("(PipelineStep::UrlWait) url matched");
                    this.complete();
                }
            }),
            () => {}
        );
    }
}

export {UrlWait};