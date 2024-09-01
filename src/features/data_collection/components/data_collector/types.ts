export type CourseBlockData = {
    id: string;
    name: string;
    required_credits: number;
    obtained_credits: number;
    remaining_credits: number;
}

export type BaseCourseData<SectionDataType = SectionData> = {
    id: string;
    name: string;
    credits: number;
    status: "not taken";
    block_id?: CourseBlockData["id"];
    prerequisites?: BaseCourseData["id"][];
    corequisites?: BaseCourseData["id"][];
    description?: string;
    sections?: SectionDataType[];
}

export type TakenCourseData = Omit<BaseCourseData, "status"> & {
    status: "taken";
    semester: string;
    grade: string;
}

export type CourseData<SectionDataType = SectionData> = BaseCourseData<SectionDataType> | TakenCourseData;

type ScraperCourseLinkData = {
    course_link_id: string;
}

export type ScraperCourseData = CourseData<ScraperSectionTypeData> & ScraperCourseLinkData;

export type SectionData<SectionTypeDataType = SectionTypeData> = {
    id: string;
    associated_section_group: number;
    status: "open" | "closed";
    schedule: SectionScheduleData[];
    type: "TH" | "TP" | "LAB";
} & SectionTypeDataType;

export type SectionScheduleData = {
    start_time: string;
    end_time: string;
    day: string;
    start_date: string;
    end_date: string;
    location: string;
    teacher: string;
}

export type TheoreticalSectionData = {
    type: "TH";
    exams: ExamScheduleData[];
}
export type ScraperTheoreticalSectionData = TheoreticalSectionData & {
    course_detail_link_id: string;
}

export type PracticalSectionData = {
    type: "TP";
}

export type LaboratorySectionData = {
    type: "LAB";
}

export type SectionTypeData = TheoreticalSectionData | PracticalSectionData | LaboratorySectionData;
export type ScraperSectionTypeData = ScraperTheoreticalSectionData | PracticalSectionData | LaboratorySectionData;

export type ExamScheduleData = {
    start_time: string;
    end_time: string;
    day: string;
    date: string;
    location: string;
    type: "final" | "intra";
}
