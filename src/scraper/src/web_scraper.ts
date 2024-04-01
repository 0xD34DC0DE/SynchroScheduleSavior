import {Context, ContextFactory} from "./context.ts";
import {TaskPipeline} from "./pipeline/task_pipeline.ts";


export class WebScraper<Ctx extends Context> {
    constructor(readonly context_factory: ContextFactory<Ctx>) {
    }

    public begin(): TaskPipeline<Ctx> {
        return new TaskPipeline(this);
    }
}