import CourseEntity, {Course} from "./Course";
import {IndexableEntity, serializeEntity} from "./types.ts";

interface Semester {
    readonly term: `${string} ${number}`;
    readonly courses: Record<string, Course>;
}

class SemesterEntity implements Semester, IndexableEntity<"term"> {
    public readonly term: `${string} ${number}`;
    public readonly courses: Record<string, CourseEntity>;

    constructor(input: Semester) {
        this.term = input.term;
        this.courses = Object.fromEntries(
            Object.entries(input.courses).map(([key, value]) => [key, new CourseEntity(value)])
        );
    }

    public serialize() {
        return {
            term: () => this.term,
            courses: () => Object.fromEntries(
                Object.entries(this.courses).map(([key, value]) => [key, serializeEntity(value)])
            ),
        };
    }
}

export type {Semester};
export default SemesterEntity;