import DataCollectorStep from "./DataCollectorStep.tsx";
import SemesterDataCollectorStatus from "./SemesterDataCollectorStatus.tsx";
import {
    CourseData,
    ExamScheduleData,
    ScraperCourseData,
    ScraperTheoreticalSectionData,
    SectionData,
    SectionTypeData,
    TheoreticalSectionData
} from "./types.ts";
import {useRef, useState} from "react";

interface DataCollectorCourseDataCollectionStepProps {
}

const DataCollectorCourseDataCollectionStep = ({}: DataCollectorCourseDataCollectionStepProps) => {
    const [coursesDataToCollectCount, setCoursesDataToCollectCount] = useState<number>(0);
    const [collectedCourseDataCount, setCollectedCourseDataCount] = useState<number>(0);
    const collectedCoursesData = useRef<CourseData[]>([]);

    return (
        <DataCollectorStep
            pipelineSteps={
                (pipeline) => pipeline
                    .set_pipeline_name("CourseDataCollectionStep")
                    .with_stored_result<ScraperCourseData[]>(
                        "available_courses",
                        (pipeline, available_courses) => {
                            setCoursesDataToCollectCount(available_courses.length);
                            let courseScheduleData: CollectedScheduleData;
                            return available_courses.reduce(
                                (pipeline, course_data) => pipeline
                                    .set_pipeline_name(`CourseDataCollection_${course_data.id}`)
                                    .click_and_wait_for_loader(`#${course_data.course_link_id}`)
                                    .task(
                                        collectCourseSchedule,
                                        [],
                                        (result) => {
                                            if ("error" in result) throw new Error(result.error);
                                            courseScheduleData = result.value;
                                            collectedCoursesData.current = [
                                                ...collectedCoursesData.current,
                                                {
                                                    ...course_data,
                                                    ...result.value
                                                }
                                            ];
                                        }
                                    )
                                    .defer(async pipeline => {
                                        const sections = courseScheduleData.sections;
                                        return sections
                                            .filter(section => section.type === "TH")
                                            .reduce((pipeline, section, i) => pipeline
                                                    .set_pipeline_name(`SectionDataCollection_${i}`)
                                                    .click_and_wait_for_loader(
                                                        `#${(section as ScraperTheoreticalSectionData).course_detail_link_id}`
                                                    )
                                                    .task(
                                                        collectExamSchedule,
                                                        [],
                                                        (result) => {
                                                            if ("error" in result) throw new Error(result.error);
                                                            (section as SectionData & TheoreticalSectionData).exams = result.value;
                                                        }
                                                    )
                                                    .click_and_wait_for_loader(courseDetailsBackButtonSelector)
                                                ,
                                                pipeline);
                                    })
                                    .click_and_wait_for_loader("#DERIVED_SAA_CRS_RETURN_PB\\$163\\$")
                                    .callback(() => setCollectedCourseDataCount(collectedCoursesData.current.length))
                                ,
                                pipeline
                            ).callback(() => console.log("Collected courses data:", collectedCoursesData.current));
                        }
                    )
            }
        >
            <SemesterDataCollectorStatus
                description={"Collecting courses data"}
                status={`Courses data collected: ${coursesDataToCollectCount} out of ${collectedCourseDataCount}`}
            />
        </DataCollectorStep>
    );
};

export default DataCollectorCourseDataCollectionStep;

const courseDetailsBackButtonSelector =
    "#gh-main-content > div.gh-page-header-wrap > div.gh-page-header > div.gh-page-header-links > div > a";

type CollectedScheduleData =
    Required<Pick<ScraperCourseData, "sections" | "corequisites" | "prerequisites" | "description">>;

function collectCourseSchedule(): CollectedScheduleData {

    let prerequisites: string[] = [];
    let corequisites: string[] = [];

    const exigences = document.querySelector("#DERIVED_CRSECAT_DESCR254A\\$0")?.textContent;

    if (exigences) {
        const corequisites_str = exigences.match(/Concomitants?: .*/)?.[0].replace(/Concomitants?: /, "") ?? null;
        if (corequisites_str) {
            corequisites = corequisites_str.split(" et ").map(corequisite => {
                if (!corequisite.includes("ou")) return corequisite;
                return corequisite.replace(/[()]/g, "").replace(" ou ", "|");
            });
        }

        const prerequisites_str = exigences.match(/Préalables?: .*/)?.[0].replace(/Préalables?: /, "") ?? null;
        if (prerequisites_str) {
            prerequisites = prerequisites_str.split(" et ").map(corequisite => {
                if (!corequisite.includes("ou")) return corequisite;
                return corequisite.replace(/[()]/g, "").replace(" ou ", "|");
            });
        }
    }
    const description = document.querySelector("#SSR_CRSE_OFF_VW_DESCRLONG\\$0")?.textContent ?? "ERROR";

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
        const checkType = (type: string): type is SectionTypeData["type"] => ["TH", "TP", "LAB"].includes(type);
        if (!checkType(type)) throw new Error("Invalid section type");

        const associatedGroupNumber =
            sectionHeader.querySelector<HTMLSpanElement>("span[id^=CLASS_ASSOCIATED\\$]")?.innerText;
        if (!associatedGroupNumber) throw new Error("Couldn't find associated group number");

        const statusSpan = sectionHeader.querySelector("div[id^=win0divCLASS_STATUS\\$] > div > span");
        if (!statusSpan) throw new Error("Couldn't find section status");
        const status: SectionData["status"] = statusSpan.classList.contains("fa-square") ? "closed" : "open";

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

        if (type === "TH") {
            sections.push({
                id: sectionId,
                associated_section_group: parseInt(associatedGroupNumber),
                status,
                type,
                schedule,
                exams: [],
                course_link_id: sectionIdLink.id,
            });
        } else {
            sections.push({
                id: sectionId,
                associated_section_group: parseInt(associatedGroupNumber),
                status,
                type,
                schedule
            });
        }
    }

    return {
        corequisites,
        prerequisites,
        description,
        sections
    };
}

function collectExamSchedule(): ExamScheduleData[] {
    const examRows = Array.from(document.querySelectorAll("tr[id^=trCLASS_EXAM_VW\\$]"));
    if (examRows.length === 0) throw new Error("Couldn't find exam rows");

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
        if (!["final", "intra"].includes(type)) throw new Error("Invalid exam type");

        const date = examRow.querySelector<HTMLSpanElement>("span[id^=UMET_DERIVED_SSR_MTG_DT_LONG\\$]")?.innerText;
        if (!date) throw new Error("Couldn't find exam row date");

        exams.push({
            start_time,
            end_time,
            day,
            location,
            type: type as ExamScheduleData["type"],
            date
        });
    }

    return exams;
}