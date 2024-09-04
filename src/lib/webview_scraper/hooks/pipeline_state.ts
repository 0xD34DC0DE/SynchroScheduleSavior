import {useState} from "react";
import {PipelineState} from "../src/pipeline/task_pipeline.ts";

const usePipelineState = () => {
    const [state, setState] = useState<PipelineState>(PipelineState.IDLE);
    const [error, setError] = useState<Error | null>(null);

    return [
        state,
        error,
        setState,
        setError
    ] as const;
};

export default usePipelineState;
