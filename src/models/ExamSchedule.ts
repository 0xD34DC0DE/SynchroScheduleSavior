import DayOfWeek from "./DayOfWeek.ts";
import TimeOfDayRange from "./TimeOfDayRange.ts";

class ExamSchedule {
    constructor(
        public readonly timeRange: TimeOfDayRange,
        public readonly day: DayOfWeek,
        public readonly date: Date,
        public readonly location: string,
        public readonly type: "final" | "midterm"
    ) {
    }

    public conflictsWith(other: ExamSchedule): boolean {
        if (!ExamSchedule.isSameDate(this.date, other.date)) return false;
        if (this.day !== other.day) return false;
        return this.timeRange.overlapsWith(other.timeRange);
    }

    private static isSameDate(date1: Date, date2: Date): boolean {
        return date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate();
    }
}

export default ExamSchedule;