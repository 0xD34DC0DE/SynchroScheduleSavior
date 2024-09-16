import {Entity} from "./types.ts";

interface TimeOfDay {
    readonly hour: number;
    readonly minute: number;
}

class TimeOfDayEntity implements TimeOfDay, Entity {
    public readonly hour: number;
    public readonly minute: number;

    constructor(input: TimeOfDay) {
        if (input.hour < 0 || input.hour > 23) throw new Error("Invalid hour");
        this.hour = input.hour;

        if (input.minute < 0 || input.minute > 59) throw new Error("Invalid minute");
        this.minute = input.minute;
    }

    serialize(){
        return {
            hour: () => this.hour,
            minute: () => this.minute
        };
    }

    public isAfter(other: TimeOfDayEntity): boolean {
        if (this.hour > other.hour) return true;
        if (this.hour < other.hour) return false;
        return this.minute > other.minute;
    }

    public isBefore(other: TimeOfDayEntity): boolean {
        if (this.hour < other.hour) return true;
        if (this.hour > other.hour) return false;
        return this.minute < other.minute;
    }
}

export type {TimeOfDay};
export default TimeOfDayEntity;