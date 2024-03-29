import {InjectableWindow} from "./window.ts";
import {Context, ContextFactory} from "./context.ts";
import {TaskPipeline} from "./pipeline/task_pipeline.ts";


class WebScrapper<Ctx extends Context> {
    constructor(readonly window: InjectableWindow,
                readonly context_factory: ContextFactory<Ctx>) {
        console.log("WebScrapper created")
    }

    public begin(): TaskPipeline<Ctx> {
        return new TaskPipeline(this);
    }
}

export {WebScrapper};