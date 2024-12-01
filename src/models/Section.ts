import SectionScheduleEntity, {SectionSchedule} from "./SectionSchedule.ts";
import ExamScheduleEntity, {ExamSchedule} from "./ExamSchedule.ts";
import {IndexableEntity, Serializable, serializeEntity} from "./types.ts";

interface Section {
    readonly id: number;
    readonly isOpen: boolean;
    readonly type: string;
    readonly campus: string;
    readonly schedule: SectionSchedule[];
    readonly midtermExam: ExamSchedule | null;
    readonly finalExam: ExamSchedule | null;
    readonly subSections: Record<Section["id"], Section>;
    readonly sectionGroup: string;
}

class SectionEntity implements Section, IndexableEntity<"id"> {
    readonly id: number;
    readonly isOpen: boolean;
    readonly type: string;
    readonly campus: string;
    readonly schedule: SectionScheduleEntity[];
    readonly midtermExam: ExamScheduleEntity | null;
    readonly finalExam: ExamScheduleEntity | null;
    readonly subSections: Record<number, SectionEntity>;
    readonly sectionGroup: string;

    constructor(input: Section) {
        this.id = input.id;
        this.isOpen = input.isOpen;
        this.type = input.type;
        this.campus = input.campus;
        this.schedule = input.schedule.map(schedule => new SectionScheduleEntity(schedule));
        this.midtermExam = input.midtermExam ? new ExamScheduleEntity(input.midtermExam) : null;
        this.finalExam = input.finalExam ? new ExamScheduleEntity(input.finalExam) : null;
        this.subSections = Object.fromEntries(
            Object.entries(input.subSections).map(
                ([key, value]) => [parseInt(key), new SectionEntity(value)]
            )
        );
        this.sectionGroup = input.sectionGroup;
    }

    serialize() {
        const subSections: Record<string, Serializable> = Object.fromEntries(
            Object.entries(this.subSections).map(([key, value]) => [key, serializeEntity(value)])
        );

        return {
            id: () => this.id,
            isOpen: () => this.isOpen,
            type: () => this.type,
            campus: () => this.campus,
            schedule: () => this.schedule.map(schedule => serializeEntity(schedule)),
            midtermExam: () => this.midtermExam ? serializeEntity(this.midtermExam) : null,
            finalExam: () => this.finalExam ? serializeEntity(this.finalExam) : null,
            subSections: () => subSections,
            sectionGroup: () => this.sectionGroup
        };
    }

    public hasScheduleConflictWith(other: SectionEntity): boolean {
        return this.schedule.some(
            schedule => other.schedule.some(
                otherSchedule => schedule.conflictsWith(otherSchedule)
            )
        );
    }

    public hasExamConflictWith(other: SectionEntity): boolean {
        if (this.midtermExam && other.midtermExam && this.midtermExam.conflictsWith(other.midtermExam)) {
            return true;
        }
        return !!(this.finalExam && other.finalExam && this.finalExam.conflictsWith(other.finalExam));
    }

    public getCompatibleSubSections(other: SectionEntity): SectionEntity[] {
        return Object.values(this.subSections).filter(
            subSection => !subSection.hasScheduleConflictWith(other) &&
                !subSection.hasExamConflictWith(other)
        );
    }
}

export type {Section};
export default SectionEntity;