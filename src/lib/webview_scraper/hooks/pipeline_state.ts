import {useState} from "react";
import {PipelineState} from "../src/pipeline/task_pipeline.ts";

const usePipelineState = () => useState<PipelineState>(PipelineState.IDLE);

export default usePipelineState;
