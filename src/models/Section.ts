import SectionSchedule from "./SectionSchedule.ts";
import ExamSchedule from "./ExamSchedule.ts";

class Section {
    constructor(
        public readonly id: number,
        public readonly isOpen: boolean,
        public readonly type: string,
        public readonly campus: string,
        public readonly schedule: SectionSchedule[],
        public readonly midtermExam: ExamSchedule | null,
        public readonly finalExam: ExamSchedule | null,
        public readonly subSections: Record<Section["id"], Section>
    ) {
    }

    public hasScheduleConflictWith(other: Section): boolean {
        return this.schedule.some(
            schedule => other.schedule.some(
                otherSchedule => schedule.conflictsWith(otherSchedule)
            )
        );
    }

    public hasExamConflictWith(other: Section): boolean {
        if (this.midtermExam && other.midtermExam && this.midtermExam.conflictsWith(other.midtermExam)) {
            return true;
        }
        return !!(this.finalExam && other.finalExam && this.finalExam.conflictsWith(other.finalExam));
    }

    public getCompatibleSubSections(other: Section): Section[] {
        return Object.values(this.subSections).filter(
            subSection => !subSection.hasScheduleConflictWith(other) &&
                !subSection.hasExamConflictWith(other)
        );
    }
}

export default Section;