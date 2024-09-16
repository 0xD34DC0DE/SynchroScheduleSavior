import CourseIdEntity, {CourseId} from "./CourseId.ts";
import type Semester from "./Semester.ts";
import {IndexableEntity, serializeEntity} from "./types.ts";

interface AttendedCourse {
    readonly id: CourseId,
    readonly grade: string,
    readonly designation: string,
    readonly term: Semester["term"],
    readonly status: "passed" | "failed" | "in progress",
}

class AttendedCourseEntity implements AttendedCourse, IndexableEntity<"id"> {
    public readonly id: CourseIdEntity;
    public readonly grade: string;
    public readonly designation: string;
    public readonly term: Semester["term"];
    public readonly status: "passed" | "failed" | "in progress";

    constructor(input: AttendedCourse) {
        this.id = new CourseIdEntity(input.id);
        this.grade = input.grade;
        this.designation = input.designation;
        this.term = input.term;
        this.status = input.status;
    }

    serialize() {
        return {
            id: () => serializeEntity(this.id),
            grade: () => this.grade,
            designation: () => this.designation,
            term: () => this.term,
            status: () => this.status
        };
    }
}

export type {AttendedCourse};
export default AttendedCourseEntity;