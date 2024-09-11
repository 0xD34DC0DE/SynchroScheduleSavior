import CourseId from "./CourseId.ts";
import Section from "./Section.ts";
import CourseExigences from "./CourseExigences.ts";
import CourseBlock from "./CourseBlock.ts";

class Course {
    constructor(
        public readonly id: CourseId,
        public readonly blockId: CourseBlock["id"],
        public readonly name: string,
        public readonly credits: number,
        public readonly exigences: CourseExigences,
        public readonly description: string,
        public readonly sections: Section[]
    ) {
    }

    public getCompatibleSections(other: Course): Section[] {
        return this.sections.filter(
            section =>
                !other.sections.some(
                    otherSection => section.hasScheduleConflictWith(otherSection)
                ) &&
                !other.sections.some(
                    otherSection => section.hasExamConflictWith(otherSection)
                )
        );
    }

    public getMatchingCoRequisites(courses: Course | Course[]): Course[] {
        return this.exigences.getMatchingCorequisites(courses);
    }

    public areExigencesSatisfiedBy(obtainedCourses: Course | Course[], attendingCourses?: Course | Course[]): boolean {
        return this.exigences.areRequisitesSatisfiedBy(obtainedCourses, attendingCourses);
    }
}

export default Course;