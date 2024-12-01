import type {DayOfWeekType} from "./DayOfWeek.ts";
import DateRangeEntity, {DateRange} from "./DateRange.ts";
import TimeOfDayRangeEntity, {TimeOfDayRange} from "./TimeOfDayRange.ts";
import {Entity, serializeEntity} from "./types.ts";

interface SectionSchedule {
    readonly timeRange: TimeOfDayRange;
    readonly dateRange: DateRange;
    readonly day: DayOfWeekType;
    readonly location: string;
    readonly teacher: string;
}

class SectionScheduleEntity implements SectionSchedule, Entity {
    public readonly timeRange: TimeOfDayRangeEntity;
    public readonly dateRange: DateRangeEntity;
    public readonly day: DayOfWeekType;
    public readonly location: string;
    public readonly teacher: string;

    constructor(input: SectionSchedule) {
        this.timeRange = new TimeOfDayRangeEntity(input.timeRange);
        this.dateRange = new DateRangeEntity(input.dateRange);
        this.day = input.day;
        this.location = input.location;
        this.teacher = input.teacher;
    }

    serialize() {
        return {
            timeRange: () => serializeEntity(this.timeRange),
            dateRange: () => serializeEntity(this.dateRange),
            day: () => this.day,
            location: () => this.location,
            teacher: () => this.teacher
        };
    }

    public conflictsWith(other: SectionScheduleEntity): boolean {
        return this.day === other.day && this.timeRange.overlapsWith(other.timeRange);
    }
}

export type {SectionSchedule};
export default SectionScheduleEntity;