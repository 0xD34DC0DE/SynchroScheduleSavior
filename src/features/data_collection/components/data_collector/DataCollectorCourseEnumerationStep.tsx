import DataCollectorStep from "./DataCollectorStep.tsx";
import {HTMLElementProxy} from "../../../../lib/webview_scraper";
import {SynchroPipelineExtension} from "../../utils";
import SemesterDataCollectorStatus from "./SemesterDataCollectorStatus.tsx";
import {Course, CourseBlock, SemesterData} from "./types.ts";
import {useRef, useState} from "react";

interface DataCollectorCourseEnumerationStepProps {
}

const DataCollectorCourseEnumerationStep = ({}: DataCollectorCourseEnumerationStepProps) => {
    const [enumeratedCoursesCount, setEnumeratedCoursesCount] = useState(0);
    const semester_data_ref = useRef<SemesterData>({
        course_blocks: [],
        courses: []
    });

    return (
        <DataCollectorStep
            pipelineSteps={
                (pipeline) => pipeline
                    .set_pipeline_name("CoursesEnumeration")
                    .store_result<SemesterData>(
                        "semester_data",
                        (pipeline, set_result) => pipeline
                            .for_each<HTMLDivElement>(
                                "div[id^=win0divDERIVED_SAA_DPR_GROUPBOX3\\$]",
                                getCourseBlockEnumerationPipeline(course_block => {
                                    semester_data_ref.current.course_blocks = [
                                        ...semester_data_ref.current.course_blocks,
                                        course_block
                                    ];

                                    const totalCourseCounts = semester_data_ref.current.course_blocks.reduce(
                                        (acc, block) => acc + block.block_courses_id.length,
                                        0
                                    )

                                    setEnumeratedCoursesCount(totalCourseCounts)
                                })
                            )
                            .callback(() => set_result(semester_data_ref.current))
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

    const course_rows = Array.from(course_block.querySelectorAll("tr[id^=trCOURSE_LIST]"));

    const courses_link_id = course_rows
        .reduce((acc, tr) => {
            const course_id = tr.querySelector("span[id^=CRSE_NAME]")?.textContent;
            if (!course_id) throw new Error("Course id not found");

            const link = tr.querySelector("a[id^=CRSE_DESCR]");
            if (!link) throw new Error("Course link not found");

            acc[course_id] = link.id;
            return acc;
        }, {} as {[key: Course["id"]]: string});

    return {
        id: block_id,
        name: block_name,
        credits_requirements,
        block_courses_id: Object.keys(courses_link_id),
        metadata: {courses_link_id}
    } satisfies CourseBlock;
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