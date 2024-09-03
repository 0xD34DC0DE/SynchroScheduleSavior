import {PipelineStepsBuilder, TaskPipeline} from "../index.ts";
import {Dispatch, SetStateAction, useContext, useEffect, useState} from "react";
import DeferredStepsContextType from "../contexts/DeferredStepsContext.ts";
import {DeferredStepsContext} from "../components/DeferredSteps.tsx";

const addExecutionStepUpdates = <T extends TaskPipeline>(
    pipelineStepsBuilder: PipelineStepsBuilder<T>,
    setIsRunning: Dispatch<SetStateAction<boolean>>
): PipelineStepsBuilder<T> => async (pipeline: T) => {
    pipeline = pipeline.callback(() => setIsRunning(true));
    return (await pipelineStepsBuilder(pipeline)).callback(() => setIsRunning(false));
}

const useDeferredStepsContext = <T extends TaskPipeline>(): DeferredStepsContextType<T> => {
    const context = useContext(DeferredStepsContext);
    if (!context) {
        throw new Error("useParentPipeline must be used within a DeferredSteps component");
    }
    return context;
}

const useDeferredSteps = <T extends TaskPipeline>(stepsBuilder: PipelineStepsBuilder<T>) => {
    const {registerStepBuilder, unregisterStepBuilder} = useDeferredStepsContext<T>();
    const [isRunning, setIsRunning] = useState(false);
    const [stepIndex, setStepIndex] = useState<number | null>(null);

    useEffect(() => {
        if (stepIndex !== null) return;
        const withExecutionStepUpdates = addExecutionStepUpdates(stepsBuilder, setIsRunning);
        const newIndex = registerStepBuilder(withExecutionStepUpdates);
        setStepIndex(newIndex);
        return () => unregisterStepBuilder(newIndex);
    }, [stepsBuilder, stepIndex, registerStepBuilder, unregisterStepBuilder]);

    return isRunning;
};

export default useDeferredSteps;