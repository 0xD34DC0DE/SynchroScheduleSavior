import TimeOfDay from "./TimeOfDay.ts";

class TimeOfDayRange {
    constructor(
        public readonly start: TimeOfDay,
        public readonly end: TimeOfDay
    ) {
    }

    public overlapsWith(other: TimeOfDayRange): boolean {
        return !(this.start.isAfter(other.end) || this.end.isBefore(other.start));
    }
}

export default TimeOfDayRange;