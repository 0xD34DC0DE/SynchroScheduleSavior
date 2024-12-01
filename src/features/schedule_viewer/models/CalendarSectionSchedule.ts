import {Course, SectionSchedule} from "../../../models";
import CalendarTimeBlock from "./CalendarTimeBlock.ts";

class CalendarSectionSchedule {
    public readonly timeBlocks: CalendarTimeBlock[];

    constructor(sectionSchedules: SectionSchedule[], course: Course) {
        this.timeBlocks = sectionSchedules.map(schedule => new CalendarTimeBlock(schedule, course));
    }
}

export default CalendarSectionSchedule;