import Course from "./Course.ts";

type Semester = {
    id: string,
    name: string,
    courses: {[key: string]: Course}
}

export default Semester;