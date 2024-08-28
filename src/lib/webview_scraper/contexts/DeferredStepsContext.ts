import {PipelineStepsBuilder, TaskPipeline} from "../index.ts";

interface DeferredStepsContextType<T extends TaskPipeline> {
    registerStepBuilder: (builder: PipelineStepsBuilder<T>) => number;
    unregisterStepBuilder: (index: number) => void;
}

export default DeferredStepsContextType;