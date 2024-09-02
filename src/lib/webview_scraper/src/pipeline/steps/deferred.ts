import PipelineStep from "../pipeline_step.ts";
import TaskPipeline from "../task_pipeline.ts";

class DeferredStep<T extends TaskPipeline, Args extends [...any]> extends PipelineStep {
    private readonly _steps_builder: PipelineStepsBuilder<T, Args>;
    private readonly _get_pipeline_builder_args: DeferredStepArgsGetter<T, Args>;

    public name = "DeferredStep";

    constructor(
        steps_builder: PipelineStepsBuilder<T, Args>,
        args_getter: DeferredStepArgsGetter<T, Args>
    ) {
        super();
        this._steps_builder = steps_builder;
        this._get_pipeline_builder_args = args_getter;
    }

    public async run(): Promise<void> {
        try {
            const {pipeline, args} = this._get_pipeline_builder_args();
            let pipeline_with_steps = this._steps_builder(pipeline, ...args);
            if (pipeline_with_steps instanceof Promise) pipeline_with_steps = await pipeline_with_steps;
            pipeline_with_steps.execute(() => this.complete());
        } catch (e) {
            this.abort(e);
        }
    }
}

export type {PipelineStepsBuilder};

export default DeferredStep;

type DeferredStepArgsGetter<
    T extends TaskPipeline,
    Args extends [...any]
> = () => { pipeline: T, args: Args };

type PipelineStepsBuilder<
    T extends TaskPipeline = TaskPipeline,
    Args extends [...any] = [...any]
> = (pipeline: T, ...args: Args) => T | Promise<T>;
