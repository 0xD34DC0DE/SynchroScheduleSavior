import CourseId from "./CourseId.ts";
import Section from "./Section.ts";
import CourseExigence from "./CourseExigence.ts";

class Course {
    constructor(
        public readonly id: CourseId,
        public readonly name: string,
        public readonly credits: number,
        public readonly exigence: CourseExigence,
        public readonly description: string,
        public readonly sections: Section[]
    ) {
    }
}

export default Course;