import Dexie, {Table} from "dexie";
import {AttendedCourseEntity, CourseBlockEntity, SemesterEntity} from "../models";
import {classMap} from "@pvermeer/dexie-class-addon";


class CoursesDatabase extends Dexie {
    public readonly semesters!: Table<SemesterEntity, string>;
    public readonly attendedCourses!: Table<AttendedCourseEntity, string>;
    public readonly courseBlocks!: Table<CourseBlockEntity, string>;

    constructor() {
        super("courses");

        classMap(this);

        this.version(1).stores({
            semesters: "term",
            attendedCourses: "[id.subject+id.number]",
            courseBlocks: "id",
        });

        this.courseBlocks.mapToClass(CourseBlockEntity);
        this.semesters.mapToClass(SemesterEntity);
        this.attendedCourses.mapToClass(AttendedCourseEntity);
    }
}

export default CoursesDatabase;
