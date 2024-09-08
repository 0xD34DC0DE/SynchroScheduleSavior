import Course from "./Course.ts";

type Semester = {
    term: `${string} ${number}`;
    courses: Record<string, Course>;
}

export default Semester;