import {CircularProgress, Grid, Typography} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from '@mui/icons-material/Error';
import PendingIcon from '@mui/icons-material/Pending';
import {MutableRefObject, useEffect, useRef, useState} from "react";
import {HTMLElementProxy, usePipelineState, useScraper} from "../../../lib/webview_scraper";
import {SynchroPipelineExtension} from "../utils";

interface SemesterDataCollectorProps {
    setCollectedCoursesData: (courses_data: CourseData[]) => void;
    collectData: boolean;
    start_url: string;
    semester: { name: string, href: string };
}

const SemesterDataCollector = (
    {
        setCollectedCoursesData,
        collectData,
        start_url,
        semester
    }: SemesterDataCollectorProps
) => {
    const [state, setState] = useState<SemesterDataCollectorState>("idle");
    const [foundCourses, setFoundCourses] = useState<string[]>([]);
    const coursesData = useRef<CourseData[]>([]);
    const scraper = useScraper();
    const [pipelineState, setPipelineState] = usePipelineState();

    useEffect(() => {
        if (!collectData) return;
        if (state !== "idle") return;
        setState("enumerating");

        return scraper
            .begin(setPipelineState, SynchroPipelineExtension)
            .navigate_to(start_url, /ExactKeys/)
            .navigate_to(semester.href, "*/SA_LEARNER_SERVICES_2.SSR_SSENRL_CART.GBL*")
            .click_and_wait_for_loader("input#DERIVED_REGFRM1_SSR_PB_SRCH")
            .for_each<HTMLInputElement>(
                "input[value^='Afficher']",
                (button, sub_pipeline) => sub_pipeline.click_and_wait_for_loader(button)
            )
            .for_each<HTMLDivElement>(
                "div[id^=win0divCOURSE_LIST\\$]",
                course_block_sub_pipeline(coursesData)
            )
            .callback(() => setState("collecting"))
            .execute();
    }, [undefined, collectData]);

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
            <Grid item xs={3} display={"flex"} justifyContent={"center"} alignItems={"center"}>
                <Typography variant={"h5"}>{semester.name}</Typography>
            </Grid>
            <Grid item display={"flex"} justifyContent={"center"} alignItems={"center"}>
                {state === "done" && <Typography variant={"body2"}>Data collection done</Typography>}
                {state === "idle" && <Typography variant={"body2"}>Waiting...</Typography>}
                {state === "enumerating" && <Typography variant={"body2"}>Searching available courses...</Typography>}
                {state === "collecting" &&
                    <Typography variant={"body2"}>
                        Collecting course information: {coursesData.length} done out of {foundCourses.length}
                    </Typography>
                }
            </Grid>
            <Grid item xs={1} display={"flex"} justifyContent={"center"} alignItems={"center"}>
                {state === "done" && <CheckCircleIcon color={"success"}/>}
                {state === "idle" && <PendingIcon/>}
                {(state === "enumerating" || state === "collecting") && <CircularProgress size={20}/>}
                {state === "error" && <ErrorIcon color={"error"}/>}
            </Grid>
        </Grid>
    );
};

export default SemesterDataCollector;

type SemesterDataCollectorState = "idle" | "enumerating" | "collecting" | "done" | "error";

type BaseCourseData = {
    id: string;
    name: string;
    credits: number;
    //block: string;
    status: "not taken";
}

type TakenCourseData = Omit<BaseCourseData, "status"> & {
    status: "taken";
    semester: string;
    grade: string;
}

type CourseData = BaseCourseData | TakenCourseData;

function next_button_condition(course_block: HTMLDivElement): boolean {
    const next_button = course_block.querySelector(
        "div[id^=gh-table-pager-COURSE_LIST\\$scroll\\$] > div.gh-table-pager.no-bottom.count-4 > ul > li:nth-child(4) > a"
    );
    if (!next_button) throw new Error("Course block next button not found");
    return !next_button.classList.contains("ui-disabled");
}

function extract_block_courses(course_block: HTMLDivElement): CourseData[] {
    return Array.from(course_block.querySelectorAll("tr[id^=trCOURSE_LIST]"))
        .map(tr => {
            const id = tr.querySelector("span[id^=CRSE_NAME]")?.textContent ?? "ERROR";
            const name = tr.querySelector("span[id^=CRSE_DESCR]")?.textContent ?? "ERROR";
            const credits = parseInt(tr.querySelector("span[id^=CRSE_UNITS]")?.textContent ?? "ERROR");
            const isTaken = tr.querySelector("span[data-gh-replace*=CREDIT_TAKEN_ICN]") !== null;
            if (isTaken) {
                const semester = tr.querySelector("span[id^=CRSE_WHEN]")?.textContent ?? "ERROR";
                const grade = tr.querySelector("span[id^=SAA_ACRSE_AVLVW_CRSE_GRADE_OFF]")?.textContent ?? "ERROR";
                return {id, name, credits, status: "taken", semester, grade};
            }
            return {id, name, credits, status: "not taken"};
        })
}

const makeNextButtonSelector = (course_list_div: HTMLElementProxy<HTMLDivElement>) => ({
    element: course_list_div,
    selector: "div[id^=gh-table-pager-COURSE_LIST]>div:first-child>ul>li:nth-child(4)>a"
});

function course_block_sub_pipeline(coursesData: MutableRefObject<(CourseData)[]>) {
    return (course_list_div: HTMLElementProxy<HTMLDivElement>, foreach_sub_pipeline: SynchroPipelineExtension) =>
        foreach_sub_pipeline
            .while(
                "post-condition",
                next_button_condition,
                [course_list_div],
                (iteration_data, while_sub_pipeline) => {
                    if (iteration_data.condition_result) {
                        while_sub_pipeline = while_sub_pipeline
                            .click_and_wait_for_loader(
                                makeNextButtonSelector(course_list_div)
                            )
                    }

                    return while_sub_pipeline.task(
                        extract_block_courses,
                        [course_list_div],
                        (result) => {
                            if ("error" in result) throw result.error;
                            coursesData.current.push(...result.value);
                        }
                    )
                },
                {max_iterations: 10}
            );
}