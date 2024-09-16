import {Entity} from "./types.ts";

interface DateRange {
    readonly start: number;
    readonly end: number;
}

class DateRangeEntity implements DateRange, Entity {
    public readonly start: number;
    public readonly startDate: Date;
    public readonly end: number;
    public readonly endDate: Date;

    constructor(input: DateRange) {
        this.start = input.start;
        this.end = input.end;
        this.startDate = new Date(input.start);
        this.endDate = new Date(input.end);
    }

    serialize() {
        return {
            start: () => this.start,
            end: () => this.end
        };
    }
}

export type {DateRange};
export default DateRangeEntity;