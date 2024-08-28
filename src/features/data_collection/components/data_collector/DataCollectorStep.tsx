import {Dispatch, ReactNode, SetStateAction, useEffect, useState} from "react";
import {SynchroPipelineExtension} from "../../utils";
import {useParentPipeline} from "./ParentPipelineProvider.tsx";
import {PipelineStepsBuilder, TaskPipeline} from "../../../../lib/webview_scraper";

interface DataCollectorStepProps {
    pipelineSteps: (pipeline: SynchroPipelineExtension) => SynchroPipelineExtension;
    children: ReactNode | ReactNode[];
}

const DataCollectorStep = ({children, pipelineSteps}: DataCollectorStepProps) => {
    const {registerStepBuilder, unregisterStepBuilder} = useParentPipeline<SynchroPipelineExtension>();
    const [isRunning, setIsRunning] = useState(false);
    const [stepIndex, setStepIndex] = useState<number | null>(null);

    useEffect(() => {
        if (stepIndex !== null) return;
        const withExecutionStepUpdates = addExecutionStepUpdates(pipelineSteps, setIsRunning);
        const newIndex = registerStepBuilder(withExecutionStepUpdates);
        setStepIndex(newIndex);
        return () => unregisterStepBuilder(newIndex);
    }, [pipelineSteps, stepIndex, registerStepBuilder, unregisterStepBuilder]);

    if (!isRunning) return null;
    return <>{children}</>;
};

function addExecutionStepUpdates<T extends TaskPipeline>(
    pipelineStepsBuilder: PipelineStepsBuilder<T>,
    setIsRunning: Dispatch<SetStateAction<boolean>>
): PipelineStepsBuilder<T> {
    return (pipeline: T)=> {
        pipeline = pipeline.callback(() => setIsRunning(true));
        return pipelineStepsBuilder(pipeline).callback(() => setIsRunning(false));
    }
}

export default DataCollectorStep;
