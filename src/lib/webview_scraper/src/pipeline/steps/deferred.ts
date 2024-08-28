import PipelineStep from "../pipeline_step.ts";
import TaskPipeline from "../task_pipeline.ts";


class DeferredStep<T extends TaskPipeline> extends PipelineStep {
    private readonly _steps_builder: AsyncPipelineStepsBuilder<T>;
    private readonly _pipeline_builder: () => T;

    public name = "DeferredStep";

    constructor(steps_builder: AsyncPipelineStepsBuilder<T>, pipeline_builder: () => T) {
        super();
        this._steps_builder = steps_builder;
        this._pipeline_builder = pipeline_builder;
    }

    public async run(): Promise<void> {
        const pipeline = this._pipeline_builder();
        await this._steps_builder(pipeline);
        pipeline.execute(() => this.complete());
    }
}

export type {PipelineStepsBuilder, AsyncPipelineStepsBuilder};

export default DeferredStep;

type PipelineStepsBuilder<T extends TaskPipeline> = (pipeline: T) => T;
type AsyncPipelineStepsBuilder<T extends TaskPipeline> = (pipeline: T) => Promise<T>;