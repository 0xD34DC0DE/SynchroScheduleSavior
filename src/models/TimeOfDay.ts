class TimeOfDay {
    public readonly hour: number;
    public readonly minute: number;

    constructor(hour: number, minute: number) {
        if (hour < 0 || hour > 23) throw new Error("Invalid hour");
        this.hour = hour;

        if (minute < 0 || minute > 59) throw new Error("Invalid minute");
        this.minute = minute;
    }
}

export default TimeOfDay;