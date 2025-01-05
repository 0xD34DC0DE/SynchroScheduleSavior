import {useSetStepState, useStepData} from "./stepper/RouteStepper.tsx";
import {CourseBlock, FollowedCourse} from "./data_collector/types.ts";
import {CircularProgress, Grid, Stack, Typography} from "@mui/material";
import Step from "./stepper/Step.tsx";
import {InjectionResult, PipelineState, usePipelineState, useScraper} from "../../../lib/webview_scraper";
import {useEffect} from "react";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import {db} from "../../../utils";
import {postProcessCourseBlocks, postProcessCourses, postProcessFollowedCourses} from "./data_collector";

interface DataFinalizationStepProps {

}

const DataFinalizationStep = ({}: DataFinalizationStepProps) => {
    const setStepCompleted = useSetStepState();
    const [previousStepData] = useStepData<{ [semester: string]: CourseBlock[] }>();
    const [pipelineState, pipelineError, setPipelineState, setPipelineError] = usePipelineState();
    const scraper = useScraper();

    useEffect(() => {
        setStepCompleted(pipelineState === PipelineState.DONE);
    }, [pipelineState, setStepCompleted]);

    useEffect(() => {
        if (pipelineState === PipelineState.DONE) return;

        return scraper
            .begin(setPipelineState, setPipelineError)
            .navigate_to(courseHistoryUrl, "*/SA_LEARNER_SERVICES_2.SSS_MY_CRSEHIST.GBL*")
            .task(getFollowedCourses, [], (followed_courses: InjectionResult<FollowedCourse[]>) => {
                if ("error" in followed_courses) throw new Error(followed_courses.error);

                const processedFollowedCourses = postProcessFollowedCourses(followed_courses.value);

                db.attendedCourses.bulkPut(processedFollowedCourses).then(async () => {
                    for (const [semester, courseBlocks] of Object.entries(previousStepData)) {
                        try {
                            const processedCourseBlocks = postProcessCourseBlocks(courseBlocks);
                            const semesterEntity = postProcessCourses(semester, courseBlocks);

                            await db.courseBlocks.bulkPut(processedCourseBlocks);
                            await db.semesters.put(semesterEntity);
                        } catch (e) {
                            console.error("Error processing semester", e);
                            throw e;
                        }

                    }

                    setPipelineState(PipelineState.DONE);
                });
            })
            .execute();
    }, [undefined, scraper, setPipelineState, setPipelineError]);

    return (
        <Grid item xs={8} sm={6} md={5}>
            <Step title={"Final step"}>
                {pipelineState === PipelineState.ABORTED &&
                    <Typography variant={"body2"} color={"error"}>
                        An error occurred during the finalization process:
                        {pipelineError?.toString() ?? "Unknown error"}
                    </Typography>
                }
                {pipelineState === PipelineState.RUNNING &&
                    <Stack spacing={2}>
                        <Typography variant={"body1"}>
                            Almost done! Please wait while the tool finalizes the data collection process.
                        </Typography>
                        <CircularProgress size={30}/>
                    </Stack>
                }
                {pipelineState === PipelineState.DONE &&
                    <Stack spacing={2}>
                        <Typography variant={"body2"}>Data collection completed!</Typography>
                        <CheckCircleIcon fontSize={"large"} color={"success"}/>
                    </Stack>
                }
            </Step>
        </Grid>
    );
};

export default DataFinalizationStep;

const courseHistoryUrl = "https://academique-dmz.synchro.umontreal.ca" +
    "/psc/acprpr9/EMPLOYEE/SA/c/SA_LEARNER_SERVICES_2.SSS_MY_CRSEHIST.GBL?Page=SSS_MY_CRSEHIST&Action=U&SRCHPROMPT=N";

const getFollowedCourses = (): FollowedCourse[] => {
    const rows = document.querySelectorAll("tr[id^=trCRSE_HIST\\$0_row]");
    if (!rows) throw new Error("Couldn't find course history rows");

    return Array.from(rows)
        .map(row => {
            const courseId = row.querySelector("span[id^=CRSE_NAME\\$]")?.textContent?.replace(/\s/g, "");
            if (!courseId) throw new Error("Couldn't find course history row's course id");

            const name = row.querySelector("a[id^=CRSE_LINK\\$]")?.textContent;
            if (!name) throw new Error("Couldn't find course history row's name");

            const designation = row.querySelector("span[id^=CRSE_DESIG_DESCR\\$]")?.textContent;
            if (!designation) throw new Error("Couldn't find course history row's designation");

            const semester = row.querySelector("span[id^=CRSE_TERM\\$]")?.textContent;
            if (!semester) throw new Error("Couldn't find course history row's semester");

            const gradeSpan = row.querySelector("span[id^=CRSE_GRADE\\$]");
            if (!gradeSpan) throw new Error("Couldn't find course history row's grade");
            const grade = gradeSpan.textContent;
            if (!grade && grade !== "") throw new Error("Couldn't find course history row's grade text");

            const creditsText = row.querySelector("span[id^=CRSE_UNITS\\$]")?.textContent;
            if (!creditsText) throw new Error("Couldn't find course history row's credits");
            const credits = parseFloat(creditsText);

            const status = row.querySelector("div[id^=win0divCRSE_STATUS\\$] span.sr-only")?.textContent;
            if (!status) throw new Error("Couldn't find course history row's status");

            return {id: courseId, name, designation, semester, grade, credits, status} satisfies FollowedCourse;
        });
}

