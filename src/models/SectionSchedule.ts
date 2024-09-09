import TimeOfDay from "./TimeOfDay.ts";
import DayOfWeek from "./DayOfWeek.ts";

class SectionSchedule {
    constructor(
        public readonly startTime: TimeOfDay,
        public readonly endTime: TimeOfDay,
        public readonly day: DayOfWeek,
        public readonly startDate: Date,
        public readonly endDate: Date,
        public readonly location: string,
        public readonly teacher: string
    ) {
    }
}

export default SectionSchedule;