import {CircularProgress, Grid, Stack, Typography} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from '@mui/icons-material/Error';
import PendingIcon from '@mui/icons-material/Pending';
import {Dispatch, SetStateAction, useEffect, useState} from "react";
import {HTMLElementProxy, PipelineState, usePipelineState, useScraper} from "../../../lib/webview_scraper";
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
    const [coursesData, setCoursesData] = useState<CourseData[]>([]);
    const [foundCoursesBlocksCount, setFoundCoursesBlocksCount] = useState<number>(0);
    const [collectedCoursesCount, setCollectedCoursesCount] = useState<number>(0);
    const scraper = useScraper();
    const [pipelineState, setPipelineState] = usePipelineState();

    useEffect(() => {
        if (!collectData) return;
        if (state !== "idle") return;
        setState("navigating");

        return scraper
            .begin(setPipelineState, SynchroPipelineExtension)
            .navigate_to(start_url, /ExactKeys/)
            .navigate_to(semester.href, "*/SA_LEARNER_SERVICES_2.SSR_SSENRL_CART.GBL*")
            .click_and_wait_for_loader("input#DERIVED_REGFRM1_SSR_PB_SRCH")
            .callback(() => setState("enumerating-blocks"))
            .for_each<HTMLInputElement>(
                "input[value^='Afficher']",
                (button, sub_pipeline) => sub_pipeline
                    .click_and_wait_for_loader(button)
                    .callback(() => setFoundCoursesBlocksCount(prev => prev + 1))
            )
            .callback(() => setState("enumerating-courses"))
            .for_each<HTMLDivElement>(
                "div[id^=win0divCOURSE_LIST\\$]",
                course_block_sub_pipeline(setCoursesData)
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
            {pipelineState === PipelineState.CANCELLED &&
                <Typography variant={"body2"} color={"error"}>
                    An error occurred during data collection
                </Typography>
            }
            {pipelineState !== PipelineState.CANCELLED &&
                <>
                    <Grid item xs={4} display={"flex"} justifyContent={"center"} alignItems={"center"}>
                        <Typography variant={"h6"}>{semester.name}</Typography>
                    </Grid>
                    <Grid item display={"flex"} justifyContent={"center"} alignItems={"center"}>
                        <SemesterDataCollectionStatus
                            state={state}
                            foundCoursesBlocksCount={foundCoursesBlocksCount}
                            coursesToCollectCount={coursesData.length}
                            collectedCoursesCount={collectedCoursesCount}
                        />
                    </Grid>
                    <Grid item xs={1} display={"flex"} justifyContent={"center"} alignItems={"center"}>
                        <SemesterDataCollectionIcon state={state}/>
                    </Grid>
                </>
            }
        </Grid>
    );
};

export default SemesterDataCollector;

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

type SemesterDataCollectorState =
    "idle"
    | "navigating"
    | "enumerating-blocks"
    | "enumerating-courses"
    | "collecting"
    | "done"
    | "error";

interface SemesterDataCollectionProps {
    state: SemesterDataCollectorState;
    foundCoursesBlocksCount: number;
    coursesToCollectCount: number;
    collectedCoursesCount: number;
}

function SemesterDataCollectionStatus(
    {
        state,
        foundCoursesBlocksCount,
        coursesToCollectCount,
        collectedCoursesCount
    }: SemesterDataCollectionProps
) {
    switch (state) {
        case "done":
            return <Typography variant={"body2"}>Data collection done</Typography>;
        case "idle":
            return <Typography variant={"body2"}>Waiting...</Typography>;
        case "navigating":
            return <Typography variant={"body2"}>Navigating to courses basket...</Typography>;
        case "enumerating-blocks":
            return (
                <Stack>
                    <Typography variant={"body2"}>Searching courses blocks...</Typography>
                    <Typography variant={"caption"}>Found {foundCoursesBlocksCount} blocks</Typography>
                </Stack>
            );
        case "enumerating-courses":
            return (
                <Stack>
                    <Typography variant={"body2"}>Searching available courses...</Typography>
                    <Typography variant={"caption"}>Found {coursesToCollectCount} courses</Typography>
                </Stack>
            );
        case "collecting":
            return (
                <Stack>
                    <Typography variant={"body2"}>Collecting course information...</Typography>
                    <Typography variant={"caption"}>
                        Collected {collectedCoursesCount} out of {coursesToCollectCount}
                    </Typography>
                </Stack>
            );
        case "error":
            return <Typography variant={"body2"} color={"error"}>An error occurred</Typography>;
    }
}

interface SemesterDataCollectionIconProps {
    state: SemesterDataCollectorState;
}

function SemesterDataCollectionIcon({state}: SemesterDataCollectionIconProps) {
    switch (state) {
        case "done":
            return <CheckCircleIcon color={"success"}/>;
        case "idle":
            return <PendingIcon/>;
        case "navigating":
        case "enumerating-courses":
        case "collecting":
        case "enumerating-blocks":
            return <CircularProgress size={20}/>;
        case "error":
            return <ErrorIcon color={"error"}/>;
    }
}

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

function course_block_sub_pipeline(setCoursesData: Dispatch<SetStateAction<(CourseData)[]>>) {
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
                            setCoursesData(prev => {
                                console.log("prev", prev)
                                return [...prev, ...result.value];
                            })
                            console.log("value", result.value);
                        }
                    )
                },
                {max_iterations: 10}
            );
}