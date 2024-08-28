import {ReactNode} from "react";
import {SynchroPipelineExtension} from "../../utils";
import {Fade} from "@mui/material";
import Box from "@mui/material/Box";
import {useDeferredSteps} from "../../../../lib/webview_scraper/hooks";

interface DataCollectorStepProps {
    pipelineSteps: (pipeline: SynchroPipelineExtension) => SynchroPipelineExtension;
    children: ReactNode | ReactNode[];
}

const DataCollectorStep = ({children, pipelineSteps}: DataCollectorStepProps) => {
    const isRunning = useDeferredSteps(pipelineSteps);

    if (!isRunning) return null;
    return (
        <Fade in={true} timeout={1000} unmountOnExit>
            <Box>
                {children}
            </Box>
        </Fade>
    );
};



export default DataCollectorStep;
