import CourseIdEntity, {CourseId} from "./CourseId.ts";
import SectionEntity, {Section} from "./Section.ts";
import CourseExigencesEntity, {CourseExigences} from "./CourseExigences.ts";
import {CourseBlock} from "./CourseBlock.ts";
import {IndexableEntity, serializeEntity} from "./types.ts";

interface Course {
    readonly id: CourseId,
    readonly blockId: CourseBlock["id"],
    readonly name: string,
    readonly credits: number,
    readonly exigences: CourseExigences,
    readonly description: string,
    readonly sections: Section[]
}

class CourseEntity implements Course, IndexableEntity<"id"> {
    public readonly id: CourseIdEntity;
    public readonly blockId: CourseBlock["id"];
    public readonly name: string;
    public readonly credits: number;
    public readonly exigences: CourseExigencesEntity
    public readonly description: string;
    public readonly sections: SectionEntity[];

    constructor(input: Course) {
        this.id = new CourseIdEntity(input.id);
        this.blockId = input.blockId;
        this.name = input.name;
        this.credits = input.credits;
        this.exigences = new CourseExigencesEntity(input.exigences);
        this.description = input.description;
        this.sections = input.sections.map(section => new SectionEntity(section));
    }

    public serialize() {
        return {
            id: () => serializeEntity(this.id),
            blockId: () => this.blockId,
            name: () => this.name,
            credits: () => this.credits,
            exigences: () => serializeEntity(this.exigences),
            description: () => this.description,
            sections: () => this.sections.map(section => serializeEntity(section))
        };
    }

    public getCompatibleSections(other: CourseEntity): SectionEntity[] {
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

    public getMatchingCoRequisites(courses: CourseEntity | CourseEntity[]): CourseEntity[] {
        return this.exigences.getMatchingCorequisites(courses);
    }

    public areExigencesSatisfiedBy(
        obtainedCourses: CourseEntity | CourseEntity[],
        attendingCourses?: CourseEntity | CourseEntity[]
    ): boolean {
        return this.exigences.areRequisitesSatisfiedBy(obtainedCourses, attendingCourses);
    }
}

export type {Course};
export default CourseEntity;