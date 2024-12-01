import {Course} from "../../../models";

export interface CourseAttributeFilter {
    filter(course: Course): boolean;
}

export class CourseSubjectFilter implements CourseAttributeFilter {
    constructor(private subject: string) {
    }

    filter(course: Course): boolean {
        return course.id.subject !== this.subject;
    }
}

export class CourseIdFilter implements CourseAttributeFilter {
    constructor(private id: Course["id"]) {
    }

    filter(course: Course): boolean {
        return course.id !== this.id;
    }
}
