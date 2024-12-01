import {Course, Section} from "../../../models";
import CalendarSectionSchedule from "./CalendarSectionSchedule.ts";
import CalendarExamBlock from "./CalendarExamBlock.ts";

class CalendarSectionGroup {
    public readonly group: string;
    public readonly mainSectionSchedule: CalendarSectionSchedule;
    public readonly subSectionSchedules: Record<string, CalendarSectionSchedule[]>;
    public readonly midtermExamTimeBlock: CalendarExamBlock | null;
    public readonly finalExamTimeBlock: CalendarExamBlock | null;

    constructor(section: Section, course: Course) {
        this.group = section.sectionGroup;
        this.mainSectionSchedule = new CalendarSectionSchedule(section.schedule, course);
        this.subSectionSchedules = CalendarSectionGroup.subSectionSchedulesByType(section, course);
        this.midtermExamTimeBlock = section.midtermExam ? new CalendarExamBlock(section.midtermExam, course) : null;
        this.finalExamTimeBlock = section.finalExam ? new CalendarExamBlock(section.finalExam, course) : null;
    }

    private static subSectionSchedulesByType(section: Section, course: Course): Record<string, CalendarSectionSchedule[]> {
        return Object.values(section.subSections).reduce((acc, subSection) => {
            const type = subSection.type;
            if (!acc[type]) acc[type] = [];
            acc[type].push(new CalendarSectionSchedule(subSection.schedule, course));
            return acc;
        }, {} as Record<string, CalendarSectionSchedule[]>);
    }
}

export default CalendarSectionGroup;