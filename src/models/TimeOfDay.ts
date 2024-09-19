import {Entity} from "./types.ts";

interface TimeOfDay {
    readonly toBeDetermined: boolean;
    readonly hour: number;
    readonly minute: number;
}

class TimeOfDayEntity implements TimeOfDay, Entity {
    public readonly toBeDetermined: boolean;
    public readonly hour: number;
    public readonly minute: number;

    constructor(input: TimeOfDay) {
        this.toBeDetermined = input.toBeDetermined;

        if (input.toBeDetermined) {
            this.hour = 0;
            this.minute = 0;
            return;
        }

        if (isNaN(input.hour) || input.hour < 0 || input.hour > 23) throw new Error(`Invalid hour ${input.hour}`);
        this.hour = input.hour;

        if (isNaN(input.minute) || input.minute < 0 || input.minute > 59) throw new Error(`Invalid minute ${input.minute}`);
        this.minute = input.minute;
    }

    serialize(){
        return {
            toBeDetermined: () => this.toBeDetermined,
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