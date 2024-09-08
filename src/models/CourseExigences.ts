import CourseId from "./CourseId.ts";
import Course from "./Course.ts";

class CourseExigences {
    constructor(
        public readonly preRequisites: Requisite[],
        public readonly coRequisites: Requisite[]
    ) {
    }

    public areRequisitesSatisfiedBy(obtainedCourses: Course | Course[], attendingCourses?: Course | Course[]): boolean {
        const preRequisitesMet = this.preRequisites.every(requisite => requisite.isSatisfiedBy(obtainedCourses));
        if (!preRequisitesMet) return false;
        if (!attendingCourses) return true;
        return this.coRequisites.every(requisite => requisite.isSatisfiedBy(attendingCourses));
    }

    public getMatchingCorequisites(courses: Course | Course[]): Course[] {
        return this.coRequisites.flatMap(requisite => requisite.getMatchingCourses(courses));
    }
}

interface Requisite {
    isSatisfiedBy(courses: Course | Course[]): boolean;
    getMatchingCourses(courses: Course | Course[]): Course[];
}

class CourseRequisite implements Requisite {
    constructor(
        public readonly courseId: CourseId
    ) {
    }

    isSatisfiedBy(courses: Course | Course[]): boolean {
        if (courses instanceof Array) return courses.some(course => course.id === this.courseId);
        return courses.id === this.courseId;
    }

    getMatchingCourses(courses: Course | Course[]): Course[] {
        if (courses instanceof Array) return courses.filter(course => course.id === this.courseId);
        if (courses.id === this.courseId) return [courses];
        return [];
    }
}

class RequisiteAny implements Requisite {
    constructor(
        public readonly requisites: Requisite[]
    ) {
    }

    isSatisfiedBy(courses: Course | Course[]): boolean {
        return this.requisites.some(requisite => requisite.isSatisfiedBy(courses));
    }

    getMatchingCourses(courses: Course | Course[]): Course[] {
        return this.requisites.flatMap(requisite => requisite.getMatchingCourses(courses));
    }
}

class CreditCountRequisite implements Requisite {
    constructor(
        public readonly minimumCredits: number,
        public readonly subject: string
    ) {
    }

    isSatisfiedBy(courses: Course | Course[]): boolean {
        if (courses instanceof Array) {
            return courses.reduce((sum, course) => sum + course.credits, 0) >= this.minimumCredits;
        }
        return courses.credits >= this.minimumCredits;
    }

    getMatchingCourses(): Course[] {
        // return nothing since otherwise we would have to return all courses of with the same subject
        return [];
    }
}

class TextualRequisite implements Requisite {
    constructor(
        public readonly text: string
    ) {
    }

    isSatisfiedBy(_courses: Course | Course[]): boolean {
        return true;
    }

    getMatchingCourses(): Course[] {
        // return nothing since we cannot determine which courses match the semantic of the text
        return [];
    }
}

export type {Requisite};
export {CourseRequisite, RequisiteAny, CreditCountRequisite, TextualRequisite};
export default CourseExigences;