import {Course} from "../../../models";
import CalendarSectionGroup from "./CalendarSectionGroup.ts";

class CalendarCourse {
    private readonly id: Course["id"];
    public readonly sectionGroups: CalendarSectionGroup[];

    constructor(course: Course) {
        this.id = course.id;
        this.sectionGroups = course.sections.map(section => new CalendarSectionGroup(section, course));
    }

    public get number(): number {
        return this.id.number;
    }

    public get subject(): string {
        return this.id.subject;
    }

    public get name(): string {
        return this.id.toString();
    };
}

export default CalendarCourse;