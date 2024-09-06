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
                                    setEnumeratedCoursesCount(courses_ref.current.length)
                                })
                            )
                            .callback(() => set_result(courses_ref.current))
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

function extractBlockCourses(course_block: HTMLDivElement): Course[] {
    return Array.from(course_block.querySelectorAll("tr[id^=trCOURSE_LIST]"))
        .map(tr => {
            const id = tr.querySelector("span[id^=CRSE_NAME]")?.textContent ?? "ERROR";
            const credits = parseInt(tr.querySelector("span[id^=CRSE_UNITS]")?.textContent ?? "ERROR");

            const link = tr.querySelector("a[id^=CRSE_DESCR]");
            if (!link) throw new Error("Course link not found");
            const name = link.textContent ?? "ERROR";
            const basket_course_link_id = link.id;

            const isTaken = tr.querySelector("span[data-gh-replace*=CREDIT_TAKEN_ICN]") !== null;
            if (isTaken) {
                const semester = tr.querySelector("span[id^=CRSE_WHEN]")?.textContent ?? "ERROR";
                const grade = tr.querySelector("span[id^=SAA_ACRSE_AVLVW_CRSE_GRADE_OFF]")?.textContent ?? "ERROR";
                return {id, name, credits, basket_course_link_id, status: "taken", semester, grade};
            }
            return {id, name, credits, basket_course_link_id, status: "not taken"};
        })
}

function getCourseBlockEnumerationPipeline(addCourses: (courses: Course[]) => void) {
    return (courseListDiv: HTMLElementProxy<HTMLDivElement>, pipeline: SynchroPipelineExtension) =>
        pipeline
            .set_pipeline_name("CourseBlockEnumeration")
            .task(
                extractBlockCourses,
                [courseListDiv],
                (result) => {
                    if ("error" in result) throw result.error;
                    addCourses(result.value)
                }
            );
}