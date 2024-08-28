export type CourseBlockData = {
    id: string;
    name: string;
    required_credits: number;
    obtained_credits: number;
    remaining_credits: number;
}

export type BaseCourseData = {
    id: string;
    name: string;
    credits: number;
    block_id?: CourseBlockData["id"];
    status: "not taken";
}

export type TakenCourseData = Omit<BaseCourseData, "status"> & {
    status: "taken";
    semester: string;
    grade: string;
}

export type CourseData = BaseCourseData | TakenCourseData;
