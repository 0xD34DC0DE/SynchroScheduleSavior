import CourseId from "./CourseId.ts";
import Semester from "./Semester.ts";

class AttendedCourse {
    constructor(
        public readonly id: CourseId,
        public readonly grade: string,
        public readonly designation: string,
        public readonly term: Semester["term"],
        public readonly status: "passed" | "failed" | "in progress",
    ) {
    }
}

export default AttendedCourse;