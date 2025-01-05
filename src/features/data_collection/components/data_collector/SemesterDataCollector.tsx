import {CircularProgress, Grid, Typography} from "@mui/material";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import {useEffect, useState} from "react";
import {PipelineState, PipelineStepsBuilder, usePipelineState, useScraper} from "../../../../lib/webview_scraper";
import {SynchroPipelineExtension} from "../../utils";
import {SemesterData} from "./types.ts";
import {DeferredSteps} from "../../../../lib/webview_scraper/components";
import DataCollectorBasketNavigationStep from "./DataCollectorBasketNavigationStep.tsx";
import DataCollectorBlocksExpansionStep from "./DataCollectorBlocksExpansionStep.tsx";
import DataCollectorCourseEnumerationStep from "./DataCollectorCourseEnumerationStep.tsx";
import DataCollectorCourseDataCollectionStep from "./DataCollectorCourseDataCollectionStep.tsx";

interface SemesterDataCollectorProps {
    setCollectedSemesterData: (semesterData: SemesterData) => void;
    collectData: boolean;
    start_url: string;
    semester: { name: string, href: string };
}

const SemesterDataCollector = (
    {
        setCollectedSemesterData,
        collectData,
        start_url,
        semester
    }: SemesterDataCollectorProps
) => {
    const scraper = useScraper();
    const [pipelineState, pipelineError, setPipelineState, setPipelineError] = usePipelineState();
    const [pipelineBuilder, setStepsBuilder] = useState<PipelineStepsBuilder<SynchroPipelineExtension>>();

    useEffect(() => {
        if (!collectData) return;
        if (PipelineState.IDLE !== pipelineState) return;
        if (!pipelineBuilder) return;

        return scraper
            .begin(setPipelineState, setPipelineError, SynchroPipelineExtension)
            .defer(pipelineBuilder)
            .execute();
    }, [undefined, collectData, pipelineBuilder]);

    return (
        <Grid
            container
            item
            justifyContent={"space-between"}
            px={1}
            xs={12}
            borderRadius={3}
            border={"1px solid rgba(0, 0, 0, 0.12)"}
            py={1}
            sx={{
                ":not(:last-child)": {
                    mb: 1
                },
            }}
        >
            {(pipelineState === PipelineState.CANCELLED || pipelineState === PipelineState.ABORTED) &&
                <Typography variant={"body2"} color={"error"}>
                    An error occurred during data collection:
                    {pipelineError?.toString() ?? "Unknown error"}
                </Typography>
            }
            {(pipelineState !== PipelineState.CANCELLED && pipelineState !== PipelineState.ABORTED) &&
                <>
                    <Grid item xs={4} display={"flex"} justifyContent={"center"} alignItems={"center"}>
                        <Typography variant={"h6"}>{semester.name}</Typography>
                    </Grid>
                    <DeferredSteps onStepsBuilderReady={setStepsBuilder}>
                        <DataCollectorBasketNavigationStep startUrl={start_url} semesterHref={semester.href}/>
                        <DataCollectorBlocksExpansionStep/>
                        <DataCollectorCourseEnumerationStep/>
                        <DataCollectorCourseDataCollectionStep setCollectedSemesterData={setCollectedSemesterData}/>
                    </DeferredSteps>
                    {pipelineState === PipelineState.DONE &&
                        <Grid item xs={6} display={"flex"} justifyContent={"center"} alignItems={"center"}>
                            <Typography variant={"body2"} color={"success"}>
                                Data collected successfully!
                            </Typography>
                        </Grid>
                    }
                    <Grid item xs={1} display={"flex"} justifyContent={"center"} alignItems={"center"}>
                        {pipelineState === PipelineState.RUNNING && <CircularProgress size={20}/>}
                        {pipelineState === PipelineState.DONE &&
                            <CheckCircleIcon fontSize={"large"} color={"success"}/>}
                    </Grid>
                </>
            }
        </Grid>
    );
};

export default SemesterDataCollector;
