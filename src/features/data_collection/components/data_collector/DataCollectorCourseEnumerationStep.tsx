import DataCollectorStep from "./DataCollectorStep.tsx";
import {HTMLElementProxy} from "../../../../lib/webview_scraper";
import {SynchroPipelineExtension} from "../../utils";
import SemesterDataCollectorStatus from "./SemesterDataCollectorStatus.tsx";
import {Course, CourseBlock} from "./types.ts";
import {useRef, useState} from "react";

interface DataCollectorCourseEnumerationStepProps {
}

const DataCollectorCourseEnumerationStep = ({}: DataCollectorCourseEnumerationStepProps) => {
    const [enumeratedCoursesCount, setEnumeratedCoursesCount] = useState(0);
    const course_blocks_ref = useRef<CourseBlock[]>([]);

    return (
        <DataCollectorStep
            pipelineSteps={
                (pipeline) => pipeline
                    .set_pipeline_name("CoursesEnumeration")
                    .store_result<CourseBlock[]>(
                        "course_blocks",
                        (pipeline, set_result) => pipeline
                            .for_each<HTMLDivElement>(
                                "div[id^=win0divDERIVED_SAA_DPR_GROUPBOX3\\$]",
                                getCourseBlockEnumerationPipeline(courseBlocks => {
                                    course_blocks_ref.current = [...course_blocks_ref.current, courseBlocks];
                                    setEnumeratedCoursesCount(course_blocks_ref.current.length)
                                })
                            )
                            .callback(() => set_result(course_blocks_ref.current))
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

function extractCourseBlock(course_block: HTMLDivElement): CourseBlock {
    const credits_requirements = document.querySelector(
        "div[id^=win0divDERIVED_SAA_DPR_SAA_DESCRLONG_06\\$] > div > span > ul > li"
    )?.textContent;
    if (!credits_requirements) throw new Error("Credits requirements not found");

    const blockHeader = course_block.querySelector("a.ui-collapsible-heading-toggle");
    if (!blockHeader) throw new Error("Block header not found");
    const [block_id, block_name] = blockHeader.textContent?.split(" ").slice(1) ?? ["ERROR", "ERROR"];

    const courses = Array.from(course_block.querySelectorAll("tr[id^=trCOURSE_LIST]"))
        .map(tr => {
            const id = tr.querySelector("span[id^=CRSE_NAME]")?.textContent ?? "ERROR";
            const credits = parseInt(tr.querySelector("span[id^=CRSE_UNITS]")?.textContent ?? "ERROR");

            const link = tr.querySelector("a[id^=CRSE_DESCR]");
            if (!link) throw new Error("Course link not found");
            const name = link.textContent ?? "ERROR";
            const basket_course_link_id = link.id;

            return {id, name, credits, basket_course_link_id, block_id} satisfies Course;
        });

    return {id: block_id, name: block_name, credits_requirements, courses} satisfies CourseBlock;
}

function getCourseBlockEnumerationPipeline(addCourseBlock: (courseBlock: CourseBlock) => void) {
    return (courseListDiv: HTMLElementProxy<HTMLDivElement>, pipeline: SynchroPipelineExtension) =>
        pipeline
            .set_pipeline_name("CourseBlockEnumeration")
            .task(
                extractCourseBlock,
                [courseListDiv],
                (result) => {
                    if ("error" in result) throw result.error;
                    addCourseBlock(result.value)
                }
            );
}