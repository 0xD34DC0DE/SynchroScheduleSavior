import type DayOfWeek from "./DayOfWeek.ts";
import TimeOfDayRangeEntity, {TimeOfDayRange} from "./TimeOfDayRange.ts";
import {Entity, serializeEntity} from "./types.ts";

interface ExamSchedule {
    readonly timeRange: TimeOfDayRange,
    readonly day: DayOfWeek,
    readonly time: number,
    readonly location: string,
    readonly type: "final" | "midterm"
}

class ExamScheduleEntity implements ExamSchedule, Entity {
    public readonly timeRange: TimeOfDayRangeEntity;
    public readonly day: DayOfWeek;
    public readonly time: number;
    public readonly date: Date;
    public readonly location: string;
    public readonly type: "final" | "midterm";

    constructor(input: ExamSchedule) {
        this.timeRange = new TimeOfDayRangeEntity(input.timeRange);
        this.day = input.day;
        this.time = input.time;
        this.date = new Date(input.time);
        this.location = input.location;
        this.type = input.type;
    }

    serialize() {
        return {
            timeRange: () => serializeEntity(this.timeRange),
            day: () => this.day,
            time: () => this.time,
            location: () => this.location,
            type: () => this.type
        };
    }

    public conflictsWith(other: ExamScheduleEntity): boolean {
        if (!ExamScheduleEntity.isSameDate(this.date, other.date)) return false;
        if (this.day !== other.day) return false;
        return this.timeRange.overlapsWith(other.timeRange);
    }

    private static isSameDate(date1: Date, date2: Date): boolean {
        return date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate();
    }
}

export type {ExamSchedule};
export default ExamScheduleEntity;