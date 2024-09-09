import Course from "./Course.ts";

class CourseBlock {
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly credits_requirements: string,
        public readonly courses: Course[],
    ) {
    }
}

export default CourseBlock;