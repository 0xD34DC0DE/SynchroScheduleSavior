export type CourseBlock = {
    id: string;
    name: string;
    required_credits: number;
    obtained_credits: number;
    remaining_credits: number;
}

export type Course = {
    id: string;
    name: string;
    credits: number;
    status: "not taken" | "taken";
    block_id?: CourseBlock["id"];
    exigence?: string;
    description?: string;
    sections?: Section[];
    semester?: string;
    grade?: string;
    basket_course_link_id?: string;
}

export type Section = {
    id: string;
    course_id?: string;
    associated_section_group: number;

    status: "open" | "closed";
    type: string;
    campus: string;

    schedule: SectionSchedule[];
    exams?: ExamSchedule[];

    course_detail_link_id?: string;
};

export type SectionSchedule = {
    start_time: string;
    end_time: string;

    day: string;

    start_date: string;
    end_date: string;

    location: string;
    teacher: string;
}

export type ExamSchedule = {
    start_time: string;
    end_time: string;

    day: string;

    date: string;

    location: string;
    type: "final" | "intra";
}
