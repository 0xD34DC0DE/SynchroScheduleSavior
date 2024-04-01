import {Context, ContextFactory} from "./context.ts";
import {TaskPipeline} from "./pipeline/task_pipeline.ts";


class WebScrapper<Ctx extends Context> {
    constructor(readonly context_factory: ContextFactory<Ctx>) {
    }

    public begin(): TaskPipeline<Ctx> {
        return new TaskPipeline(this);
    }
}

export {WebScrapper};