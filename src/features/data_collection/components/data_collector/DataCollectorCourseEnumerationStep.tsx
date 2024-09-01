import DataCollectorStep from "./DataCollectorStep.tsx";
import {HTMLElementProxy} from "../../../../lib/webview_scraper";
import {SynchroPipelineExtension} from "../../utils";
import SemesterDataCollectorStatus from "./SemesterDataCollectorStatus.tsx";
import {ScraperCourseData} from "./types.ts";
import {useRef, useState} from "react";

interface DataCollectorCourseEnumerationStepProps {
}

const DataCollectorCourseEnumerationStep = ({}: DataCollectorCourseEnumerationStepProps) => {
    const [enumeratedCoursesCount, setEnumeratedCoursesCount] = useState(0);
    const coursesData = useRef<ScraperCourseData[]>([]);

    return (
        <DataCollectorStep
            pipelineSteps={
                (pipeline) => pipeline
                    .store_result(
                        "available_courses",
                        (set_result, pipeline) => pipeline
                            .for_each<HTMLDivElement>(
                                "div[id^=win0divCOURSE_LIST\\$]",
                                enumerateBlockCourse(courses_data => {
                                    coursesData.current = [...coursesData.current, ...courses_data];
                                    setEnumeratedCoursesCount(coursesData.current.length)
                                })
                            )
                            .callback(() => set_result(coursesData))
                    )
            }
        >
            <SemesterDataCollectorStatus
                description={"Enumerating courses"}
                status={`Found ${enumeratedCoursesCount} courses`}
            />
        </DataCollectorStep>
    );
};

export default DataCollectorCourseEnumerationStep;

function extractBlockCourses(course_block: HTMLDivElement): ScraperCourseData[] {
    return Array.from(course_block.querySelectorAll("tr[id^=trCOURSE_LIST]"))
        .map(tr => {
            const id = tr.querySelector("span[id^=CRSE_NAME]")?.textContent ?? "ERROR";
            const credits = parseInt(tr.querySelector("span[id^=CRSE_UNITS]")?.textContent ?? "ERROR");

            const link = tr.querySelector("span[id^=CRSE_DESCR]");
            if (!link) throw new Error("Course link not found");
            const name = link.textContent ?? "ERROR";
            const course_link_id = link.id;

            const isTaken = tr.querySelector("span[data-gh-replace*=CREDIT_TAKEN_ICN]") !== null;
            if (isTaken) {
                const semester = tr.querySelector("span[id^=CRSE_WHEN]")?.textContent ?? "ERROR";
                const grade = tr.querySelector("span[id^=SAA_ACRSE_AVLVW_CRSE_GRADE_OFF]")?.textContent ?? "ERROR";
                return {id, name, credits, course_link_id, status: "taken", semester, grade};
            }
            return {id, name, credits, course_link_id, status: "not taken"};
        })
}

function next_button_condition(course_block: HTMLDivElement): boolean {
    const next_button = course_block.querySelector(
        "div[id^=gh-table-pager-COURSE_LIST\\$scroll\\$] > div.gh-table-pager.no-bottom.count-4 > ul > li:nth-child(4) > a"
    );
    if (!next_button) throw new Error("Course block next button not found");
    return !next_button.classList.contains("ui-disabled");
}

const nextButtonSelector = "div[id^=gh-table-pager-COURSE_LIST]>div:first-child>ul>li:nth-child(4)>a";

function enumerateBlockCourse(addCoursesData: (courses_data: ScraperCourseData[]) => void) {
    return (courseListDiv: HTMLElementProxy<HTMLDivElement>, foreach_sub_pipeline: SynchroPipelineExtension) =>
        foreach_sub_pipeline
            .while(
                "post-condition",
                next_button_condition,
                [courseListDiv],
                (iteration_data, while_sub_pipeline) => {
                    if (iteration_data.condition_result) {
                        while_sub_pipeline = while_sub_pipeline
                            .click_and_wait_for_loader({element: courseListDiv, selector: nextButtonSelector})
                    }

                    return while_sub_pipeline.task(
                        extractBlockCourses,
                        [courseListDiv],
                        (result) => {
                            if ("error" in result) throw result.error;
                            addCoursesData(result.value)
                        }
                    )
                },
                {max_iterations: 10}
            );
}