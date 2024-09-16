import DataCollectorStep from "./DataCollectorStep.tsx";
import SemesterDataCollectorStatus from "./SemesterDataCollectorStatus.tsx";
import {CourseBlock, ExamSchedule, Section} from "./types.ts";
import {Dispatch, SetStateAction, useState} from "react";
import {InjectionResult} from "../../../../lib/webview_scraper";
import {SynchroPipelineExtension} from "../../utils";

interface DataCollectorCourseDataCollectionStepProps {
    setCollectedCourseBlocks: (courseBlocks: CourseBlock[]) => void;
}

const DataCollectorCourseDataCollectionStep = ({setCollectedCourseBlocks}: DataCollectorCourseDataCollectionStepProps) => {
    const [coursesDataToCollectCount, setCoursesDataToCollectCount] = useState<number>(0);
    const [collectedCourseDataCount, setCollectedCourseDataCount] = useState<number>(0);

    return (
        <DataCollectorStep
            pipelineSteps={
                (pipeline) => pipeline
                    .set_pipeline_name("CourseDataCollectionStep")
                    .with_stored_result<CourseBlock[]>(
                        "course_blocks",
                        (pipeline, course_blocks) => {
                            const courseCount = course_blocks.reduce(
                                (acc, block) => acc + block.courses.length, 0
                            );
                            setCoursesDataToCollectCount(courseCount);

                            return getCourseScheduleCollectionPipeline(
                                course_blocks,
                                setCollectedCourseDataCount,
                                pipeline
                            ).callback(() => setCollectedCourseBlocks(course_blocks));
                        }
                    )
            }
        >
            <SemesterDataCollectorStatus
                description={"Collecting courses data"}
                status={`Courses data collected: ${collectedCourseDataCount}/${coursesDataToCollectCount}`}
            />
        </DataCollectorStep>
    );
};

export default DataCollectorCourseDataCollectionStep;

function getCourseScheduleCollectionPipeline(
    courseBlocks: CourseBlock[],
    setCollectedCoursesCount: Dispatch<SetStateAction<number>>,
    pipeline: SynchroPipelineExtension
) {
    let scheduleAndDetails: CourseSchedulesAndDetails;

    return courseBlocks.flatMap(block => block.courses)
        .reduce(
            (pipeline, course) => pipeline
                .set_pipeline_name(`CourseSchedule_${course.id}`)
                .click_and_wait_for_loader(`#${course.basket_course_link_id}`)
                .task(
                    collectCourseScheduleAndDetails,
                    [],
                    (result: InjectionResult<CourseSchedulesAndDetails>) => {
                        if ("error" in result) throw new Error(result.error);
                        scheduleAndDetails = result.value;
                        const courseBlock = courseBlocks.find(block => block.id === course.block_id);
                        if (!courseBlock) throw new Error(`Couldn't find course block with id: ${course.block_id}`);

                        courseBlock.courses = [
                            ...courseBlock.courses,
                            {
                                ...course,
                                ...result.value
                            }
                        ];
                    }
                )
                .defer((pipeline: SynchroPipelineExtension) => {
                    return scheduleAndDetails.sections
                        .filter(section => section.type === "TH")
                        .reduce(addExamScheduleCollectionPipeline, pipeline);
                })
                .click_and_wait_for_loader(courseBasketBackButtonSelector)
                .callback(() => setCollectedCoursesCount(count => count + 1))
            ,
            pipeline
        );
}

function addExamScheduleCollectionPipeline(pipeline: SynchroPipelineExtension, section: Section, index: number) {
    return pipeline
        .set_pipeline_name(`ExamSchedule_${index}`)
        .click_and_wait_for_loader(`#${section.course_detail_link_id}`)
        .task(
            collectExamSchedule,
            [],
            (result) => {
                if ("error" in result) throw new Error(result.error);
                section.exams = result.value;
            }
        )
        .click_and_wait_for_loader(courseDetailsBackButtonSelector);
}

const courseDetailsBackButtonSelector =
    "#gh-main-content > div.gh-page-header-wrap > div.gh-page-header > div.gh-page-header-links > div > a";

const courseBasketBackButtonSelector = "#DERIVED_SAA_CRS_RETURN_PB\\$163\\$";

type CourseSchedulesAndDetails = {
    exigences: string;
    description: string;
    sections: Section[];
}

function collectCourseScheduleAndDetails(): CourseSchedulesAndDetails {
    const exigences = document.querySelector("#DERIVED_CRSECAT_DESCR254A\\$0")?.textContent ?? "ERROR";
    const description = document.querySelector("#SSR_CRSE_OFF_VW_DESCRLONG\\$0")?.textContent ?? "ERROR";

    const noScheduleWarning = document.querySelector("#DERIVED_SAA_CRS_SSS_LONGCHAR_2\\$146\\$");
    if (noScheduleWarning) return {exigences, description, sections: []};

    const tableBody = document.querySelector("#ACE_CLASS_TBL_VW5\\$0 > tbody");
    if (!tableBody) throw new Error("Couldn't find table body");

    const tableRows = Array.from(tableBody.children);
    const oddRows = tableRows.filter((_, i) => (i + 1) % 2 !== 0);
    const groupedRows = oddRows.reduce((acc, _, i, arr) => {
        if (i % 2 === 0) acc.push(arr.slice(i, i + 2));
        return acc;
    }, [] as Element[][]);

    const sections = [];
    for (const [sectionHeader, scheduleTable] of groupedRows) {
        const sectionIdLink = sectionHeader.querySelector<HTMLLinkElement>("a[id^=CLASS_SECTION\\$]");
        if (!sectionIdLink) throw new Error("Couldn't find section id link");

        const sectionId = sectionIdLink.textContent;
        if (!sectionId) throw new Error("Couldn't find section id");

        const type = sectionId.match(/([A-Z]*) \(/)?.[1];
        if (!type) throw new Error("Couldn't find section type");

        const associatedGroupNumber =
            sectionHeader.querySelector<HTMLSpanElement>("span[id^=CLASS_ASSOCIATED\\$]")?.innerText;
        if (!associatedGroupNumber) throw new Error("Couldn't find associated group number");

        const statusSpan = sectionHeader.querySelector("div[id^=win0divCLASS_STATUS\\$] > div > span");
        if (!statusSpan) throw new Error("Couldn't find section status");
        const status: Section["status"] = statusSpan.classList.contains("fa-square") ? "closed" : "open";

        const scheduleRows = scheduleTable.querySelector("table[id^=CLASS_MTGPAT\\$scroll\\$] > tbody")?.children;
        if (!scheduleRows) throw new Error("Couldn't find section's schedule rows");

        const schedule = [];
        for (const scheduleRow of Array.from(scheduleRows)) {
            const days = scheduleRow.querySelector<HTMLSpanElement>("span[id^=MTGPAT_DAYS\\$]")?.innerText;
            if (!days) throw new Error("Couldn't find section's schedule row days");

            const start_time = scheduleRow.querySelector<HTMLSpanElement>("span[id^=MTGPAT_START2\\$]")?.innerText;
            if (!start_time) throw new Error("Couldn't find section's schedule row start time");

            const end_time = scheduleRow.querySelector<HTMLSpanElement>("span[id^=MTGPAT_END\\$]")?.innerText;
            if (end_time === undefined) throw new Error("Couldn't find section's schedule row end time");

            const location = scheduleRow.querySelector<HTMLSpanElement>("span[id^=MTGPAT_ROOM\\$]")?.innerText;
            if (!location) throw new Error("Couldn't find section's schedule row location");

            const teacher = scheduleRow.querySelector<HTMLSpanElement>("span[id^=MTGPAT_INSTR\\$]")?.innerText;
            if (!teacher) throw new Error("Couldn't find section's schedule row teacher");

            const dates = scheduleRow.querySelector<HTMLSpanElement>("span[id^=MTGPAT_DATES\\$]")?.innerText;
            if (!dates) throw new Error("Couldn't find section's schedule row dates");
            const [start_date, end_date] = dates.split(" - ");

            schedule.push({
                start_time,
                end_time,
                day: days,
                start_date,
                end_date,
                location,
                teacher
            });
        }

        sections.push({
            id: sectionId,
            course_detail_link_id: sectionIdLink.id,
            associated_section_group: parseInt(associatedGroupNumber),
            status,
            type,
            //TODO:
            campus: "Main",
            schedule
        });
    }

    return {
        exigences,
        description,
        sections
    };
}

function collectExamSchedule(): ExamSchedule[] {
    const examRows = Array.from(document.querySelectorAll("tr[id^=trCLASS_EXAM_VW\\$]"));
    if (examRows.length === 0) return [];

    let exams = [];
    for (const examRow of examRows) {
        const schedule = examRow.querySelector<HTMLSpanElement>("span[id^=EXM_SCHED\\$]")?.innerText;
        if (!schedule) throw new Error("Couldn't find exam row schedule");
        const [day, start_time, end_time] = schedule.replace(" -", "").split(" ");

        const location = examRow.querySelector<HTMLSpanElement>("span[id^=EXM_LOC\\$]")?.innerText;
        if (!location) throw new Error("Couldn't find exam row location");

        const description = examRow.querySelector<HTMLSpanElement>("span[id^=UMET_DERIVED_DESCR\\$]")?.innerText;
        if (!description) throw new Error("Couldn't find exam row description");
        const type = description.replace("Examen ", "");
        if (!["final", "intra"].includes(type)) throw new Error(`Invalid exam type: ${type}`);

        const date = examRow.querySelector<HTMLSpanElement>("span[id^=UMET_DERIVED_SSR_MTG_DT_LONG\\$]")?.innerText;
        if (!date) throw new Error("Couldn't find exam row date");

        exams.push({
            start_time,
            end_time,
            day,
            location,
            type: type as ExamSchedule["type"],
            date
        });
    }

    return exams;
}