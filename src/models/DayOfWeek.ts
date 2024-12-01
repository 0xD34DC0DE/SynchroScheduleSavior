const DayOfWeek = {
    Monday: "Monday",
    Tuesday: "Tuesday",
    Wednesday: "Wednesday",
    Thursday: "Thursday",
    Friday: "Friday",
    Saturday: "Saturday",
    Sunday: "Sunday",
    ToBeDetermined: "To be determined",
} as const;

export const DayOfWeekKeys = Object.keys(DayOfWeek) as (keyof typeof DayOfWeek)[];

export type DayOfWeekType = keyof typeof DayOfWeek;

export default DayOfWeek;
