import SectionSchedule from "./SectionSchedule.ts";
import {ExamSchedule} from "../features/data_collection/components/data_collector/types.ts";

class Section {
    constructor(
        public readonly id: number,
        public readonly isOpen: boolean,
        public readonly type: string,
        public readonly campus: string,
        public readonly schedule: SectionSchedule[],
        public readonly exams: ExamSchedule[],
        public readonly subSections: Record<Section["id"], Section>
    ) {
    }
}

export default Section;