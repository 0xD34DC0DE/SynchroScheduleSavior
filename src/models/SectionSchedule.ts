import TimeOfDay from "./TimeOfDay.ts";
import DayOfWeek from "./DayOfWeek.ts";
import DateRanges from "./DateRanges.ts";

class SectionSchedule {
    constructor(
        public readonly startTime: TimeOfDay,
        public readonly endTime: TimeOfDay,
        public readonly day: DayOfWeek,
        public readonly dateRanges: DateRanges,
        public readonly location: string,
        public readonly teacher: string
    ) {
    }
}

export default SectionSchedule;