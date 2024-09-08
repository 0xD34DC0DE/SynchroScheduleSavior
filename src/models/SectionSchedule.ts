import DayOfWeek from "./DayOfWeek.ts";
import DateRange from "./DateRanges.ts";
import TimeOfDayRange from "./TimeOfDayRange.ts";

class SectionSchedule {
    constructor(
        public readonly timeRange: TimeOfDayRange,
        public readonly dateRange: DateRange,
        public readonly day: DayOfWeek,
        public readonly location: string,
        public readonly teacher: string
    ) {
    }

    public conflictsWith(other: SectionSchedule): boolean {
        return this.day === other.day && this.timeRange.overlapsWith(other.timeRange);
    }
}

export default SectionSchedule;