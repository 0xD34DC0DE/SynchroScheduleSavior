import DataCollectorStep from "./DataCollectorStep.tsx";
import {HTMLElementProxy} from "../../../../lib/webview_scraper";
import {SynchroPipelineExtension} from "../../utils";
import SemesterDataCollectorStatus from "./SemesterDataCollectorStatus.tsx";
import {Course} from "./types.ts";
import {useRef, useState} from "react";

interface DataCollectorCourseEnumerationStepProps {
}

const DataCollectorCourseEnumerationStep = ({}: DataCollectorCourseEnumerationStepProps) => {
    const [enumeratedCoursesCount, setEnumeratedCoursesCount] = useState(0);
    const courses_ref = useRef<Course[]>([]);

    return (
        <DataCollectorStep
            pipelineSteps={
                (pipeline) => pipeline
                    .set_pipeline_name("CoursesEnumeration")
                    .store_result<Course[]>(
                        "available_courses",
                        (pipeline, set_result) => pipeline
                            .for_each<HTMLDivElement>(
                                "div[id^=win0divCOURSE_LIST\\$]",
                                getCourseBlockEnumerationPipeline(courses => {
                                    courses_ref.current = [...courses_ref.current, ...courses];
                                    //TODO: Remove this test error once error handling is working correctly
                                    if(courses_ref.current.length > 20) throw "Test error";
                                    setEnumeratedCoursesCount(courses_ref.current.length)
                                })
                            )
                            .callback(() => set_result(courses_ref.current))
                    )
                    .for_each<HTMLLinkElement>(
                        expandAllButtonSelector,
                        (expandAllButton, pipeline) => pipeline
                            .click_and_wait_for_loader(expandAllButton)
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

const expandAllButtonSelector =
    "div[id^=gh-table-pager-COURSE_LIST\\$scroll\\$] > div.gh-table-pager-more > ul > li:nth-child(2):nth-last-child(2) > a";

function extractBlockCourses(course_block: HTMLDivElement): Course[] {
    return Array.from(course_block.querySelectorAll("tr[id^=trCOURSE_LIST]"))
        .map(tr => {
            const id = tr.querySelector("span[id^=CRSE_NAME]")?.textContent ?? "ERROR";
            const credits = parseInt(tr.querySelector("span[id^=CRSE_UNITS]")?.textContent ?? "ERROR");

            const link = tr.querySelector("a[id^=CRSE_DESCR]");
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

function nextButtonCondition(course_block: HTMLDivElement): boolean {
    const next_button = course_block.querySelector(
        "div[id^=gh-table-pager-COURSE_LIST\\$scroll\\$] > div.gh-table-pager.no-bottom.count-4 > ul > li:nth-child(4) > a"
    );
    if (!next_button) throw new Error("Course block next button not found");
    return !next_button.classList.contains("ui-disabled");
}

const nextButtonSelector = "div[id^=gh-table-pager-COURSE_LIST]>div:first-child>ul>li:nth-child(4)>a";

function getCourseBlockEnumerationPipeline(addCourses: (courses: Course[]) => void) {
    return (courseListDiv: HTMLElementProxy<HTMLDivElement>, pipeline: SynchroPipelineExtension) =>
        pipeline
            .set_pipeline_name("CourseBlockEnumeration")
            .while(
                "post-condition",
                nextButtonCondition,
                [courseListDiv],
                (iteration_data, while_pipeline) => {
                    if (iteration_data.condition_result) {
                        while_pipeline = while_pipeline
                            .click_and_wait_for_loader({element: courseListDiv, selector: nextButtonSelector})
                    }

                    return while_pipeline.task(
                        extractBlockCourses,
                        [courseListDiv],
                        (result) => {
                            if ("error" in result) throw result.error;
                            addCourses(result.value)
                        }
                    )
                },
                {max_iterations: 10}
            );
}