import {useSetStepState, useStepData} from "./stepper/RouteStepper.tsx";
import {Course, CourseBlock, FollowedCourse, Section} from "./data_collector/types.ts";
import {CircularProgress, Grid, Stack, Typography} from "@mui/material";
import Step from "./stepper/Step.tsx";
import {InjectionResult, PipelineState, usePipelineState, useScraper} from "../../../lib/webview_scraper";
import {useEffect} from "react";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import * as model from "../../../models";

interface DataFinalizationStepProps {

}

const DataFinalizationStep = ({}: DataFinalizationStepProps) => {
    const setStepCompleted = useSetStepState();
    const [previousStepData] = useStepData<CourseBlock[]>();
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
                //TODO
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
            const courseId = row.querySelector("span[id^=CRSE_NAME\\$]")?.textContent;
            if (!courseId) throw new Error("Couldn't find course history row's course id");

            const designation = row.querySelector("span[id^=CRSE_DESIG_DESCR\\$]")?.textContent;
            if (!designation) throw new Error("Couldn't find course history row's designation");

            const semester = row.querySelector("span[id^=CRSE_TERM\\$]")?.textContent;
            if (!semester) throw new Error("Couldn't find course history row's semester");

            const gradeSpan = row.querySelector("span[id^=CRSE_GRADE\\$]");
            if (!gradeSpan) throw new Error("Couldn't find course history row's grade");
            const grade = gradeSpan.textContent;
            if (!grade) throw new Error("Couldn't find course history row's grade text");

            const status = row.querySelector("div[id^=win0divCRSE_STATUS\\$] span.sr-only")?.textContent;
            if (!status) throw new Error("Couldn't find course history row's status");

            return {id: courseId, designation, semester, grade, status} satisfies FollowedCourse;
        });
}


const postprocessCourseBlocks = (courseBlocks: CourseBlock[], followedCourses: FollowedCourse[]) => {
    const processedCourseBlocks = getCourseBlocks(courseBlocks);
    const processedCoursed = getCourses(courseBlocks);
}

const getCourseId = (courseId: string) => {
    const subject = courseId.substring(0, 3);
    const number = parseInt(courseId.substring(3));
    return new model.CourseId(subject, number);
};

const getCourses = (courseBlocks: CourseBlock[]) => {
    return courseBlocks.flatMap(courseBlock => {
        return courseBlock.courses.map(course => {
            const courseId = getCourseId(course.id);
            const credits = course.credits;
            const exigences = getCourseExigences(course.exigence);
            const description = course.description;
            const sections = getSections(course.sections);
            return new model.Course(courseId, course.name, credits, exigences, description, sections);
        });
    });
};

const getSections = (sections?: Section[]) => {
    if (!sections) return [];
    return sections.map(section => {
        const schedule = getSchedule(section.schedule);
        const exams = getExams(section.exams);
        return new model.Section(
            section.id,
            section.associated_section_group,
            section.status,
            section.type,
            section.campus,
            schedule,
            exams
        );
    });
}

const getCourseExigences = (exigences?: string) => {
    if (!exigences) return new model.CourseExigences([], []);
    if (exigences.includes("compétence")) return new model.CourseExigences([], []); //TODO
    if (exigences.includes("crédits")) return new model.CourseExigences([], []); //TODO

    const parts = exigences.replace(/Concomitants?: /, "").replace(/Préalables?: /, "").split(" et ");
    const requisites = parts.map(part => {
        if (part.includes(" ou ")) {
            const orParts = part.replace(/[()]/, "").split(" ou ");
            return new model.RequisiteAny(
                orParts.map(getCourseId).map(courseId => new model.CourseRequisite(courseId))
            );
        }
        return new model.CourseRequisite(getCourseId(part));
    });

    if (exigences.includes("Concomitant")) {
        return new model.CourseExigences([], requisites);
    }

    return new model.CourseExigences(requisites, []);
}

const getCourseBlocks = (courseBlocks: CourseBlock[]) => {
    return courseBlocks.map(courseBlock => {
        const coursesId = courseBlock.courses.map(course => getCourseId(course.id));
        const creditsRequirements = getCreditRequirements(courseBlock.credits_requirements);
        return new model.CourseBlock(courseBlock.id, courseBlock.name, creditsRequirements, coursesId);
    });
};

const getCreditRequirements = (creditsRequirements: string) => {
    const parts = creditsRequirements.split(",");
    const requiredCredits = parseFloat(parts[0].split(":")[1]);
    const obtainedCredits = parseFloat(parts[1]);
    return new model.CreditsRequirements(requiredCredits, obtainedCredits);
}