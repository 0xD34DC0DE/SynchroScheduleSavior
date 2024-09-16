import {Entity} from "./types.ts";

interface CourseId {
    subject: string;
    number: number;
}

class CourseIdEntity implements CourseId, Entity {
    public readonly subject: string;
    public readonly number: number;

    constructor(input: CourseId) {
        if (!/^[A-Z]{3}$/.test(input.subject)) throw new Error(`Invalid subject: ${input.subject}`);
        if (!Number.isInteger(input.number) || input.number < 1000 || input.number > 9999) {
            throw new Error(`Invalid number: ${input.number}`);
        }
        this.subject = input.subject;
        this.number = input.number;
    }

    public serialize() {
        return {
            subject: () => this.subject,
            number: () => this.number,
        };
    }

    public readonly equals = (other: CourseId): boolean => this.subject === other.subject && this.number === other.number

    public readonly toString = (): string => `${this.subject}${this.number}`;
}

export type {CourseId};
export default CourseIdEntity;