class DateRanges {
    constructor(
        public readonly ranges: DateRange[]
    ) {
    }
}

class DateRange {
    constructor(
        public readonly start: Date,
        public readonly end: Date
    ) {
    }
}

export { DateRange };
export default DateRanges;