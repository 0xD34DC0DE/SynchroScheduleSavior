import Course from "./Course.ts";

class Semester {
    constructor(
        public readonly term: `${string} ${number}`,
        public readonly courses: Record<string, Course>
    ) {
    }
}

export default Semester;