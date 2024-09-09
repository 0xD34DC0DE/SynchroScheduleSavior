import CourseId from "./CourseId.ts";

class CourseExigence {
    constructor(
        public readonly preRequisites: Requisite[],
        public readonly coRequisites: Requisite[]
    ) {
    }
}

interface Requisite {
    isSatisfiedBy(courseIds: CourseId[]): boolean;
    isSatisfiedBy(courseId: CourseId): boolean;
}

class SingleRequisite implements Requisite{
    constructor(
        public readonly courseId: CourseId
    ) {
    }

    isSatisfiedBy(courseIds: CourseId[]): boolean;
    isSatisfiedBy(courseId: CourseId): boolean;
    isSatisfiedBy(courseId: CourseId | CourseId[]): boolean {
        throw new Error("Method not implemented.");
    }
}

class RequisiteAny implements Requisite {
    constructor(
        public readonly requisites: Requisite[]
    ) {
    }

    isSatisfiedBy(courseIds: CourseId[]): boolean;
    isSatisfiedBy(courseId: CourseId): boolean;
    isSatisfiedBy(courseId: CourseId | CourseId[]): boolean {
        throw new Error("Method not implemented.");
    }
}

export type { Requisite };
export { SingleRequisite, RequisiteAny };
export default CourseExigence;