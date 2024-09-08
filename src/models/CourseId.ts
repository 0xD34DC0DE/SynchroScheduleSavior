class CourseId {
    public readonly subject: string;
    public readonly number: number;

    public constructor(subject: string, number: number) {
        if (!/^[A-Z]{3}$/.test(subject)) throw new Error(`Invalid subject: ${subject}`);
        if (!Number.isInteger(number) || number <= 1000 || number > 9999) {
            throw new Error(`Invalid number: ${number}`);
        }

        this.subject = subject;
        this.number = number;
    }

    public readonly toString = (): string => `${this.subject}${this.number}`;
}

export default CourseId;