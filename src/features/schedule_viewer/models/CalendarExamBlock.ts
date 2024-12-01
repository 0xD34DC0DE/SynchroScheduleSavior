import {TimeBlock} from "./TimeBlock.ts";
import {Course, DayOfWeekType, ExamSchedule, TimeOfDay} from "../../../models";

class CalendarExamBlock implements TimeBlock {
    public readonly type: "final" | "midterm";
    public readonly courseId: string;
    public readonly courseName: string;
    public readonly dayOfWeek: DayOfWeekType;
    public readonly startDate: Date;
    public readonly endDate: Date;
    public readonly startTime: TimeOfDay;
    public readonly endTime: TimeOfDay;
    public readonly location: string;
    public readonly teacher: string;

    constructor(exam: ExamSchedule, course: Course) {
        this.type = exam.type;
        this.courseId = course.id.toString();
        this.courseName = course.name;
        this.startDate = new Date(exam.time);
        this.endDate = new Date(exam.time);
        this.startTime = exam.timeRange.start;
        this.endTime = exam.timeRange.end;
        this.location = exam.location;
        this.teacher = "";
        this.dayOfWeek = exam.day;
    }
}

export default CalendarExamBlock;