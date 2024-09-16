import TimeOfDayEntity, {TimeOfDay} from "./TimeOfDay.ts";
import {Entity, serializeEntity} from "./types.ts";

interface TimeOfDayRange {
    start: TimeOfDay;
    end: TimeOfDay;
}

class TimeOfDayRangeEntity implements TimeOfDayRange, Entity {
    public readonly start: TimeOfDayEntity;
    public readonly end: TimeOfDayEntity;

    constructor(input: TimeOfDayRange) {
        this.start = new TimeOfDayEntity(input.start);
        this.end = new TimeOfDayEntity(input.end);
    }

    serialize() {
        return {
            start: () => serializeEntity(this.start),
            end: () => serializeEntity(this.end)
        };
    }

    public overlapsWith(other: TimeOfDayRangeEntity): boolean {
        return !(this.start.isAfter(other.end) || this.end.isBefore(other.start));
    }
}

export type {TimeOfDayRange};
export default TimeOfDayRangeEntity;