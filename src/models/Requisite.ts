import CourseEntity from "./Course.ts";
import CourseIdEntity, {CourseId} from "./CourseId.ts";
import {Entity, serializeEntity} from "./types.ts";

interface Requisite {
    readonly type: string;
    readonly data: { [key: string]: any };
}

class RequisiteEntity implements Requisite, RequisiteDelegate {
    private readonly delegate: RequisiteDelegate;

    public get type(): string {
        return this.delegate.type;
    }

    public get data(): { [key: string]: any } {
        return serializeEntity(this.delegate);
    }

    constructor(input: Requisite) {
        const RequisiteClass = RequisiteClasses[input.type];
        if (!RequisiteClass) throw new Error(`Unknown Requisite type: ${input.type}`);
        this.delegate = new RequisiteClass(input);
    }

    serialize() {
        return {
            type: () => this.type,
            data: () => this.data
        };
    }

    isSatisfiedBy(courses: CourseEntity | CourseEntity[]): boolean {
        return this.delegate.isSatisfiedBy(courses);
    }

    getMatchingCourses(courses: CourseEntity | CourseEntity[]): CourseEntity[] {
        return this.delegate.getMatchingCourses(courses);
    }
}

interface RequisiteDelegate extends Entity {
    readonly type: string;

    isSatisfiedBy(courses: CourseEntity | CourseEntity[]): boolean;

    getMatchingCourses(courses: CourseEntity | CourseEntity[]): CourseEntity[];
}

class CourseRequisite implements RequisiteDelegate {
    public readonly type: string = "CourseRequisite";
    public readonly courseId: CourseIdEntity;

    constructor(input: { courseId: CourseId }) {
        this.courseId = new CourseIdEntity(input.courseId);
    }

    serialize() {
        return {
            courseId: () => serializeEntity(this.courseId)
        };
    }

    isSatisfiedBy(courses: CourseEntity | CourseEntity[]): boolean {
        if (courses instanceof Array) return courses.some(course => course.id === this.courseId);
        return courses.id === this.courseId;
    }

    getMatchingCourses(courses: CourseEntity | CourseEntity[]): CourseEntity[] {
        if (courses instanceof Array) return courses.filter(course => course.id === this.courseId);
        if (courses.id === this.courseId) return [courses];
        return [];
    }
}

class RequisiteAny implements RequisiteDelegate {
    public readonly type: string = "RequisiteAny";

    public readonly requisites: RequisiteDelegate[];

    constructor(input: any) {
        if (typeof input !== "object") throw new Error("RequisiteAny must be an object");
        if (!Array.isArray(input.requisites)) throw new Error("RequisiteAny must have a 'requisites' field");
        this.requisites = input.requisites.map((requisite: any) => new RequisiteEntity(requisite));
    }

    serialize() {
        return {
            requisites: () => this.requisites.map(requisite => serializeEntity(requisite))
        };
    }

    isSatisfiedBy(courses: CourseEntity | CourseEntity[]): boolean {
        return this.requisites.some(requisite => requisite.isSatisfiedBy(courses));
    }

    getMatchingCourses(courses: CourseEntity | CourseEntity[]): CourseEntity[] {
        return this.requisites.flatMap(requisite => requisite.getMatchingCourses(courses));
    }
}

class CreditCountRequisite implements RequisiteDelegate {
    public readonly type: string = "CreditCountRequisite";

    public readonly minimumCredits: number;

    public readonly subject: string;

    constructor(input: { minimumCredits: number, subject: string }) {
        this.minimumCredits = input.minimumCredits;
        this.subject = input.subject;
    }

    serialize() {
        return {
            minimumCredits: () => this.minimumCredits,
            subject: () => this.subject
        };
    }

    isSatisfiedBy(courses: CourseEntity | CourseEntity[]): boolean {
        if (courses instanceof Array) {
            return courses.reduce((sum, course) => sum + course.credits, 0) >= this.minimumCredits;
        }
        return courses.credits >= this.minimumCredits;
    }

    getMatchingCourses(): CourseEntity[] {
        // return nothing since otherwise we would have to return all courses of with the same subject
        return [];
    }
}

class TextualRequisite implements RequisiteDelegate {
    public readonly type: string = "TextualRequisite";
    public readonly text: string;

    constructor(input: { text: string }) {
        this.text = input.text;
    }

    serialize() {
        return {
            text: () => this.text
        };
    }

    isSatisfiedBy(): boolean {
        return true;
    }

    getMatchingCourses(): CourseEntity[] {
        // return nothing since we cannot determine which courses match the semantic of the text
        return [];
    }
}

const RequisiteClasses: Record<string, new (input: any) => RequisiteDelegate> = {
    "CourseRequisite": CourseRequisite,
    "RequisiteAny": RequisiteAny,
    "CreditCountRequisite": CreditCountRequisite,
    "TextualRequisite": TextualRequisite
};

export type {Requisite};
export default RequisiteEntity;