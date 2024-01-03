import Course from "./Course.ts";

type Semester = {
    term: string,
    cycle: string,
    courses: {[key: string]: Course}
}

export default Semester;