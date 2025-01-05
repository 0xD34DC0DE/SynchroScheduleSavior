
export type SemestersData = {
    [semester: string]: SemestersData
};

export type SemesterData = {
    course_blocks: CourseBlock[];
    courses: Course[];
}

export type CourseBlock = {
    id: string;
    name: string;
    credits_requirements: string;
    block_courses_id: Course["id"][];

    metadata: {
        courses_link_id: {[key: Course["id"]]: string};
    }
}

export type Course = {
    id: string;
    name: string;
    description: string;
    credits: number;
    exigences: string;
    time_slots: CourseTimeSlot[];
    sections: CourseSection[];
    sections_exams: CourseExam[];

    metadata: {
        exams_link_id: {[section_letter: CourseExam["section_letter"]]: string};
    }
}

export type CourseTimeSlot = {
    section_id: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
    location: string;
    teacher: string;
    start_date: string;
    end_date: string;
}

export type CourseSection = {
    id: string;
    is_open: boolean;
    type: string;
}

export type CourseExam = {
    section_letter: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
    type: string;
    location: string;
    date: string;
}

export type FollowedCourse = {
    id: Course["id"];
    name: Course["name"];
    designation: string;
    semester: string;
    grade: string;
    credits: Course["credits"];
    status: string;
}