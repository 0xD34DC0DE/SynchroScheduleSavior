import type CourseEntity from "./Course.ts";
import RequisiteEntity, {Requisite} from "./Requisite.ts";
import {Entity, serializeEntity} from "./types.ts";


interface CourseExigences {
    readonly preRequisites: Requisite[];
    readonly coRequisites: Requisite[];
}

class CourseExigencesEntity implements CourseExigences, Entity {
    public readonly preRequisites: RequisiteEntity[];
    public readonly coRequisites: RequisiteEntity[];

    constructor(input: CourseExigences) {
        this.preRequisites = input.preRequisites.map(requisite => new RequisiteEntity(requisite));
        this.coRequisites = input.coRequisites.map(requisite => new RequisiteEntity(requisite));
    }

    serialize() {
        return {
            preRequisites: () => this.preRequisites.map(requisite => serializeEntity(requisite)),
            coRequisites: () => this.coRequisites.map(requisite => serializeEntity(requisite))
        };
    }

    public areRequisitesSatisfiedBy(
        obtainedCourses: CourseEntity | CourseEntity[],
        attendingCourses?: CourseEntity | CourseEntity[]
    ): boolean {
        const preRequisitesMet = this.preRequisites.every(requisite => requisite.isSatisfiedBy(obtainedCourses));
        if (!preRequisitesMet) return false;
        if (!attendingCourses) return true;
        return this.coRequisites.every(requisite => requisite.isSatisfiedBy(attendingCourses));
    }

    public getMatchingCorequisites(courses: CourseEntity | CourseEntity[]): CourseEntity[] {
        return this.coRequisites.flatMap(requisite => requisite.getMatchingCourses(courses));
    }
}

export type {CourseExigences};
export default CourseExigencesEntity;