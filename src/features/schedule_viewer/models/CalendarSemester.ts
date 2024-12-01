import {Course, DayOfWeekKeys, DayOfWeekType, Semester} from "../../../models";
import CalendarCourse from "./CalendarCourse.ts";
import CalendarTimeBlock from "./CalendarTimeBlock.ts";
import {CourseAttributeFilter} from "./CourseAttributeFilter.ts";

class CalendarSemester {
    public readonly term: `${string} ${number}`;
    public readonly calendarCourses: Record<string, CalendarCourse>;
    private readonly courses: Course[];
    private filters: CourseAttributeFilter[] = [];

    constructor(semester: Semester) {
        this.term = semester.term;
        this.courses = Object.values(semester.courses);
        this.calendarCourses = Object.fromEntries(
            this.courses.map(course => [course.id.toString(), new CalendarCourse(course)])
        );
    }

    private filteredCourses(): CalendarCourse[] {
        return this.filters.reduce(
            (courses, filter) => courses.filter(course => filter.filter(course)),
            this.courses
        ).map(course => this.calendarCourses[course.id.toString()]);
    }

    public timeBlocksPerDay(): Map<DayOfWeekType, CalendarTimeBlock[]> {
        const days = new Map<DayOfWeekType, CalendarTimeBlock[]>();
        for (const day of DayOfWeekKeys) days.set(day, []);
        this.allTimeBlocks().forEach(timeBlock => days.get(timeBlock.dayOfWeek)?.push(timeBlock));
        return days;
    }

    private allTimeBlocks() {
        const courses = this.filteredCourses();
        const timeBlocks = courses.flatMap(course =>
            course.sectionGroups.flatMap(section => section.mainSectionSchedule.timeBlocks)
        );
        courses.forEach(course => {
            timeBlocks.push(...course.sectionGroups.flatMap(
                section => Object.values(section.subSectionSchedules).flatMap(
                    subSection => subSection.flatMap(
                        schedule => schedule.timeBlocks
                    )
                )
            ));
        });
        return timeBlocks;
    }

    public addFilter(filter: CourseAttributeFilter) {
        this.filters.push(filter);
    }

    public removeFilter(filter: CourseAttributeFilter) {
        this.filters = this.filters.filter(f => f !== filter);
    }
}

export default CalendarSemester;