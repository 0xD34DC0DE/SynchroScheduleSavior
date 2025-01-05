import DataCollectorStep from "./DataCollectorStep.tsx";
import SemesterDataCollectorStatus from "./SemesterDataCollectorStatus.tsx";
import {Course, CourseExam, CourseSection, CourseTimeSlot, SemesterData} from "./types.ts";
import {Dispatch, SetStateAction, useState} from "react";
import {InjectionResult} from "../../../../lib/webview_scraper";
import {SynchroPipelineExtension} from "../../utils";

interface DataCollectorCourseDataCollectionStepProps {
    setCollectedSemesterData: (semesterData: SemesterData) => void;
}

const DataCollectorCourseDataCollectionStep = ({setCollectedSemesterData}: DataCollectorCourseDataCollectionStepProps) => {
    const [coursesDataToCollectCount, setCoursesDataToCollectCount] = useState<number>(0);
    const [collectedCourseDataCount, setCollectedCourseDataCount] = useState<number>(0);

    return (
        <DataCollectorStep
            pipelineSteps={
                (pipeline) => pipeline
                    .set_pipeline_name("CourseDataCollectionStep")
                    .with_stored_result<SemesterData>(
                        "semester_data",
                        (pipeline, semester_data) => {
                            const courseCount = semester_data.course_blocks.reduce(
                                (acc, block) => acc + block.block_courses_id.length, 0
                            );
                            setCoursesDataToCollectCount(courseCount);

                            return getCourseScheduleCollectionPipeline(
                                semester_data,
                                setCollectedCourseDataCount,
                                pipeline
                            ).callback(() => setCollectedSemesterData(semester_data));
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
    semesterData: SemesterData,
    setCollectedCoursesCount: Dispatch<SetStateAction<number>>,
    pipeline: SynchroPipelineExtension
) {
    let course = {} as Course;

    return semesterData.course_blocks
        .flatMap(({metadata: {courses_link_id}}) => Object.entries(courses_link_id))
        .reduce(
            (pipeline, [course_id, course_link_id]) => pipeline
                .set_pipeline_name(`CourseSchedule_${course_id}`)
                .click_and_wait_for_loader(`#${course_link_id}`)
                .task(
                    collectCourse,
                    [],
                    (result: InjectionResult<Course>) => {
                        if ("error" in result) throw new Error(result.error);
                        course = result.value;
                        semesterData.courses.push(course);
                    }
                )
                .defer((pipeline: SynchroPipelineExtension) =>
                    addExamScheduleCollectionPipeline(pipeline, course)
                )
                .click_and_wait_for_loader(courseBasketBackButtonSelector)
                .callback(() => setCollectedCoursesCount(count => count + 1))
            ,
            pipeline
        );
}

function addExamScheduleCollectionPipeline(pipeline: SynchroPipelineExtension, course: Course) {
    const exams_link_id = Object.values(course.metadata.exams_link_id);

    for (let i = 0; i < exams_link_id.length; i++) {
        const exam_link_id = exams_link_id[i];

        pipeline = pipeline
            .set_pipeline_name(`ExamSchedule_${course.id}_${exam_link_id}`)
            .click_and_wait_for_loader(`#${exam_link_id}`)
            .task(
                collectExamSchedule,
                [],
                (result) => {
                    if ("error" in result) throw new Error(result.error);
                    course.sections_exams.push(...result.value);
                }
            )
            .click_and_wait_for_loader(courseDetailsBackButtonSelector);
    }

    return pipeline;
}

const courseDetailsBackButtonSelector =
    "#gh-main-content > div.gh-page-header-wrap > div.gh-page-header > div.gh-page-header-links > div > a";

const courseBasketBackButtonSelector = "#DERIVED_SAA_CRS_RETURN_PB\\$163\\$";

function collectCourse(): Course {
    const course = {
        id: "",
        name: "",
        description: "",
        credits: 0,
        exigences: "",
        time_slots: [] as CourseTimeSlot[],
        sections: [] as CourseSection[],
        sections_exams: [] as CourseExam[],
        metadata: {
            exams_link_id: {} as { [section_letter: CourseExam["section_letter"]]: string }
        }
    } satisfies Course;

    const courseDetailsTitle = document.querySelector("#DERIVED_CRSECAT_DESCR200")?.textContent ?? "ERROR";
    const [id, name] = courseDetailsTitle.split(" - ");
    course.id = id;
    course.name = name;

    course.exigences = document.querySelector("#DERIVED_CRSECAT_DESCR254A\\$0")?.textContent ?? "ERROR";
    course.description = document.querySelector("#SSR_CRSE_OFF_VW_DESCRLONG\\$0")?.textContent ?? "ERROR";
    course.credits = parseFloat(document.querySelector("span[id^=DERIVED_CRSECAT_UNITS_RANGE]")?.textContent ?? "ERROR");

    const noScheduleWarning = document.querySelector("#DERIVED_SAA_CRS_SSS_LONGCHAR_2\\$146\\$");
    if (noScheduleWarning) return course;

    const tableBody = document.querySelector("#ACE_CLASS_TBL_VW5\\$0 > tbody");
    if (!tableBody) throw new Error("Couldn't find table body");

    const tableRows = Array.from(tableBody.children);
    const oddRows = tableRows.filter((_, i) => (i + 1) % 2 !== 0);
    const groupedRows = oddRows.reduce((acc, _, i, arr) => {
        if (i % 2 === 0) acc.push(arr.slice(i, i + 2));
        return acc;
    }, [] as Element[][]);

    for (const [sectionHeader, scheduleTable] of groupedRows) {
        const sectionIdLink = sectionHeader.querySelector<HTMLLinkElement>("a[id^=CLASS_SECTION\\$]");
        if (!sectionIdLink) throw new Error("Couldn't find section id link");

        const sectionId = sectionIdLink.textContent;
        if (!sectionId) throw new Error("Couldn't find section id");

        const type = sectionId.match(/([A-Z]*) \(/)?.[1];
        if (!type) throw new Error("Couldn't find section type");

        if (type === "TH") {
            const section_letter = sectionId.match(/([A-Z]+)_/)?.[1];
            if (section_letter === undefined) throw new Error("Couldn't find section letter");
            course.metadata.exams_link_id[section_letter] = sectionIdLink.id;
        }

        const statusSpan = sectionHeader.querySelector("div[id^=win0divCLASS_STATUS\\$] > div > span");
        if (!statusSpan) throw new Error("Couldn't find section status");
        const status = statusSpan.classList.contains("fa-square") ? "closed" : "open";

        const scheduleRows = scheduleTable.querySelector("table[id^=CLASS_MTGPAT\\$scroll\\$] > tbody")?.children;
        if (!scheduleRows) throw new Error("Couldn't find section's schedule rows");

        course.sections.push({id: sectionId, is_open: status === "open", type});

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

            course.time_slots.push({
                section_id: sectionId,
                day_of_week: days,
                start_time,
                end_time,
                location,
                teacher,
                start_date,
                end_date
            });
        }
    }

    return course;
}

function collectExamSchedule(): CourseExam[] {
    const section_letter = document.querySelector("#DERIVED_CLSRCH_DESCR200")?.textContent?.match(/- ([A-Z]+)/)?.[1]
    if (section_letter === undefined) throw new Error("Couldn't find section letter");

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
            section_letter,
            day_of_week: day,
            start_time,
            end_time,
            type,
            location,
            date
        });
    }

    return exams;
}