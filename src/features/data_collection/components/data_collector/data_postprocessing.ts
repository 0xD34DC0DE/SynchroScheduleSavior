import {FollowedCourse} from "./types.ts";
import type * as model from "../../../../models";
import {AttendedCourseEntity, DayOfWeek,} from "../../../../models";

const getAttendedCourseStatus = (followedCourse: FollowedCourse): model.AttendedCourse["status"] => {
    if (followedCourse.status === "Inscrit") return "in progress";
    if (followedCourse.status !== "Prise") throw new Error(`Unknown status ${followedCourse.status}`);

    const specialGrades = ["EXE", "ABA", "ATT"];
    const specialGradeIndex = specialGrades.indexOf(followedCourse.grade);
    if (specialGradeIndex !== -1) {
        switch (specialGradeIndex) {
            case 0:
                return "failed";
            case 1:
                return "passed";
            case 2:
                return "in progress";
        }
    }

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

const getTimeOfDay = (time: string): model.TimeOfDay => {
    if (time.includes("À communiquer") || time === "") {
        return {hour: 0, minute: 0, toBeDetermined: true} satisfies model.TimeOfDay;
    }

    const [hour, minute] = time.split(":").map(part => parseInt(part));
    if (isNaN(hour) || isNaN(minute)) throw new Error(`Invalid time '${time}', hour: '${hour}', minute: '${minute}'`);

    return {hour, minute, toBeDetermined: false} satisfies model.TimeOfDay;
}

const dayOfWeekLUT: Record<string, model.DayOfWeekType> = {
    "Lun": DayOfWeek.Monday,
    "Ma": DayOfWeek.Tuesday,
    "Mer": DayOfWeek.Wednesday,
    "J": DayOfWeek.Thursday,
    "V": DayOfWeek.Friday,
    "S": DayOfWeek.Saturday,
    "D": DayOfWeek.Sunday
};

const getDayOfWeek = (day: string): model.DayOfWeekType => {
    if (day === "À communiquer") return "ToBeDetermined";

    const dayOfWeek = dayOfWeekLUT[day];
    if (dayOfWeek === undefined) throw new Error(`Unknown day ${day}`);
    return dayOfWeek;
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