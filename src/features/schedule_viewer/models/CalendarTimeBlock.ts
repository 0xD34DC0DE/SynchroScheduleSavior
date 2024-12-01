import {Course, DayOfWeekType, SectionSchedule, TimeOfDay} from "../../../models";
import {TimeBlock} from "./TimeBlock.ts";

class CalendarTimeBlock implements TimeBlock {
    public readonly courseId: string;
    public readonly courseName: string;
    public readonly dayOfWeek: DayOfWeekType;
    public readonly startDate: Date;
    public readonly endDate: Date;
    public readonly startTime: TimeOfDay;
    public readonly endTime: TimeOfDay;
    public readonly location: string;
    public readonly teacher: string;

    constructor(schedule: SectionSchedule, course: Course) {
        this.courseId = course.id.toString();
        this.courseName = course.name;
        this.startDate = new Date(schedule.dateRange.start);
        this.endDate = new Date(schedule.dateRange.end);
        this.startTime = schedule.timeRange.start;
        this.endTime = schedule.timeRange.end;
        this.location = schedule.location;
        this.teacher = schedule.teacher;
        this.dayOfWeek = schedule.day;
    }
}

export default CalendarTimeBlock;