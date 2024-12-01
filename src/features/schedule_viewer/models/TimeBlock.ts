import {DayOfWeekType, TimeOfDay} from "../../../models";

export interface TimeBlock {
    courseId: string;
    courseName: string;
    dayOfWeek: DayOfWeekType;
    startDate: Date;
    endDate: Date;
    startTime: TimeOfDay;
    endTime: TimeOfDay;
    location: string;
    teacher: string;
}