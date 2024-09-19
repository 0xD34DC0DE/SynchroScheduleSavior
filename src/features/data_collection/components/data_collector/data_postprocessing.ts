import {CourseBlock, ExamSchedule, FollowedCourse, Section, SectionSchedule} from "./types.ts";
import type * as model from "../../../../models";
import {
    AttendedCourseEntity,
    CourseBlockEntity,
    CourseEntity,
    DayOfWeek,
    Semester,
    SemesterEntity
} from "../../../../models";

const getAttendedCourseStatus = (followedCourse: FollowedCourse): model.AttendedCourse["status"] => {
    if (followedCourse.status === "Inscrit") return "in progress";
    if (followedCourse.status !== "Prise") throw new Error(`Unknown status ${followedCourse.status}`);

    const numericGrades = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "E", "F"];
    const firstCyclePassThreshold = numericGrades.indexOf("D");
    const superiorCyclesPassThreshold = numericGrades.indexOf("C");

    const grade = numericGrades.indexOf(followedCourse.grade);
    const cycle = parseInt(followedCourse.designation.split(" ")[0][0]);
    if (cycle === 1 && grade >= firstCyclePassThreshold) return "passed";
    if (cycle > 1 && grade >= superiorCyclesPassThreshold) return "passed";
    return "failed";
}

const postProcessFollowedCourses = (followedCourses: FollowedCourse[]): AttendedCourseEntity[] => {
    return followedCourses.map(followedCourse => {
        const courseId = getCourseId(followedCourse.id);

        const [season, year] = followedCourse.semester.split(" ");
        if (!season || !year) throw new Error(`Couldn't parse semester ${followedCourse.semester}`);

        const status = getAttendedCourseStatus(followedCourse);
        return new AttendedCourseEntity({
            id: courseId,
            grade: followedCourse.grade,
            designation: followedCourse.designation,
            term: `${season} ${parseInt(year)}`,
            status
        });
    });
}

const getCourseId = (courseId: string): model.CourseId => {
    const subject = courseId.replace(/\s/g, "").substring(0, 3);
    const number = parseInt(courseId.substring(3));
    return {subject, number};
};

const postProcessCourses = (term: string, courseBlocks: CourseBlock[]): SemesterEntity => {
    const courses = courseBlocks.flatMap(courseBlock =>
        courseBlock.courses.map(course => {
            const courseId = getCourseId(course.id);
            const credits = course.credits;
            const exigences = getCourseExigences(course.exigence);
            const description = course.description ?? "No description available";
            const sections = getSections(course.sections);
            return new CourseEntity({
                id: courseId,
                blockId: courseBlock.id,
                name: course.name,
                credits,
                exigences,
                description,
                sections
            });
        })
    );

    const courseMap = courses.reduce((acc, course) => {
        acc[course.id.toString()] = course;
        return acc;
    }, {} as Record<string, model.CourseEntity>);

    return new SemesterEntity({term: term as Semester["term"], courses: courseMap}) satisfies model.SemesterEntity;
};

const getTimeOfDay = (time: string): model.TimeOfDay => {
    const [hour, minute] = time.split(":").map(parseInt);
    return {hour, minute} satisfies model.TimeOfDay;
    if (time.includes("À communiquer") || time === "") {
        return {hour: 0, minute: 0, toBeDetermined: true} satisfies model.TimeOfDay;
    }

}

const getDayOfWeek = (day: string): model.DayOfWeek => {
    if (day === "À communiquer") return DayOfWeek.ToBeDetermined;

    const lut: Record<string, model.DayOfWeek> = {
        "Lun": DayOfWeek.Monday,
        "Mar": DayOfWeek.Tuesday,
        "Mer": DayOfWeek.Wednesday,
        "J": DayOfWeek.Thursday,
        "V": DayOfWeek.Friday,
        "S": DayOfWeek.Saturday,
        "D": DayOfWeek.Sunday
    };
    return lut[day];
}

const getSchedule = (schedules: SectionSchedule[]): model.SectionSchedule[] => {
    return schedules.map(schedule => {
        const start = getTimeOfDay(schedule.start_time);
        const end = getTimeOfDay(schedule.end_time);
        const timeRange: model.TimeOfDayRange = {start, end};

        const startDate = new Date(schedule.start_date);
        const endDate = new Date(schedule.end_date);
        const dateRange: model.DateRange = {start: startDate.getTime(), end: endDate.getTime()};

        const day = getDayOfWeek(schedule.day);

        return {
            timeRange,
            dateRange,
            day,
            location: schedule.location,
            teacher: schedule.teacher
        } satisfies model.SectionSchedule;
    });
};

const getExams = (exams?: ExamSchedule[]): model.ExamSchedule[] => {
    if (!exams) return [];

    const examTypeLut: Record<string, "final" | "midterm"> = {
        "intra": "midterm",
        "final": "final"
    };

    return exams.map(exam => {
        const start = getTimeOfDay(exam.start_time);
        const end = getTimeOfDay(exam.end_time);
        const timeRange: model.TimeOfDayRange = {start, end};

        const day = getDayOfWeek(exam.day);

        const date = new Date(exam.date);

        const type = examTypeLut[exam.type];

        return {timeRange, day, time: date.getTime(), location: exam.location, type};
    });
}

function getSection(section: Section, subSections = {}): model.Section {
    const id = section.id.search(/(\(\d+\))/);
    const schedule = getSchedule(section.schedule);
    const exams = getExams(section.exams);
    const finalExam = exams.find(exam => exam.type === "final") ?? null;
    const midtermExam = exams.find(exam => exam.type === "midterm") ?? null;
    return {
        id,
        isOpen: section.status === "open",
        type: section.type,
        campus: section.campus,
        schedule,
        midtermExam,
        finalExam,
        subSections
    };
}

const getSections = (sections?: Section[]): model.Section[] => {
    if (!sections) return [];

    const subSectionGroups: Record<number, model.Section[]> = {};

    sections
        .filter(section => section.type !== "TH")
        .forEach(section => {
            const sections = getSection(section);
            if (subSectionGroups[section.associated_section_group] === undefined) {
                subSectionGroups[section.associated_section_group] = [];
            }
            subSectionGroups[section.associated_section_group].push(sections);
        });

    return sections
        .filter(section => section.type === "TH")
        .map(section => getSection(section, subSectionGroups[section.associated_section_group]));
}

const getCourseExigences = (exigences?: string): model.CourseExigences => {
    if (!exigences) return {preRequisites: [], coRequisites: []};
    if (exigences.includes("compétence")) return {preRequisites: [], coRequisites: []};
    if (exigences.includes("crédits")) return {preRequisites: [], coRequisites: []};

    const parts = exigences.replace(/Concomitants?: /, "").replace(/Préalables?: /, "").split(" et ");
    const requisites = parts.map(part => {
        if (part.includes(" ou ")) {
            const orParts = part.replace(/[()]/, "").split(" ou ");
            return {
                type: "RequisiteAny",
                data: orParts.map(getCourseId).map(courseId => ({
                    type: "CourseRequisite",
                    data: courseId
                }))
            };
        }
        return {
            type: "CourseRequisite",
            data: getCourseId(part)
        } satisfies model.Requisite;
    });

    if (exigences.includes("Concomitant")) {
        return {preRequisites: [], coRequisites: requisites} satisfies model.CourseExigences;
    }

    return {preRequisites: requisites, coRequisites: []} satisfies model.CourseExigences;
}

const postProcessCourseBlocks = (courseBlocks: CourseBlock[]): CourseBlockEntity[] => {
    return courseBlocks.map(courseBlock => {
        const coursesId = courseBlock.courses.map(course => getCourseId(course.id));
        const creditsRequirements = getCreditRequirements(courseBlock.credits_requirements);
        return new CourseBlockEntity({id: courseBlock.id, name: courseBlock.name, creditsRequirements, coursesId});
    });
};

const getCreditRequirements = (creditsRequirements: string): model.CreditsRequirements => {
    const parts = creditsRequirements.split(",");
    const requiredCredits = parseFloat(parts[0].split(":")[1]);
    const obtainedCredits = parseFloat(parts[1]);
    return {requiredCredits, obtainedCredits} satisfies model.CreditsRequirements;
};

export {
    postProcessFollowedCourses,
    postProcessCourses,
    postProcessCourseBlocks
}