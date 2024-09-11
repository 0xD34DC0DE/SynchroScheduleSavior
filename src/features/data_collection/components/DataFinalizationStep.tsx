import {useSetStepState, useStepData} from "./stepper/RouteStepper.tsx";
import {CourseBlock, ExamSchedule, FollowedCourse, Section, SectionSchedule} from "./data_collector/types.ts";
import {CircularProgress, Grid, Stack, Typography} from "@mui/material";
import Step from "./stepper/Step.tsx";
import {InjectionResult, PipelineState, usePipelineState, useScraper} from "../../../lib/webview_scraper";
import {useEffect} from "react";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import * as model from "../../../models";
import Dexie, {type EntityTable} from "dexie";

interface DataFinalizationStepProps {

}

const DataFinalizationStep = ({}: DataFinalizationStepProps) => {
    const setStepCompleted = useSetStepState();
    const [previousStepData] = useStepData<CourseBlock[]>();
    const [pipelineState, pipelineError, setPipelineState, setPipelineError] = usePipelineState();
    const scraper = useScraper();

    useEffect(() => {
        setStepCompleted(pipelineState === PipelineState.DONE);
    }, [pipelineState, setStepCompleted]);

    useEffect(() => {
        if (pipelineState === PipelineState.DONE) return;

        return scraper
            .begin(setPipelineState, setPipelineError)
            .navigate_to(courseHistoryUrl, "*/SA_LEARNER_SERVICES_2.SSS_MY_CRSEHIST.GBL*")
            .task(getFollowedCourses, [], (followed_courses: InjectionResult<FollowedCourse[]>) => {
                if ("error" in followed_courses) throw new Error(followed_courses.error);
                const {processedCourseBlocks, processedCourses, attendedCourses} =
                    postprocessCourseBlocks(previousStepData, followed_courses.value);

                const db = new Dexie("courses") as Dexie & {
                    courseBlocks: EntityTable<model.CourseBlock, "id">;
                    courses: EntityTable<model.Course, "id">;
                    attendedCourses: EntityTable<model.AttendedCourse, "id">;
                }
                db.version(1).stores({
                    courseBlocks: "id, name, creditsRequirements, coursesId",
                    courses: "[id.subject+id.number], blockId, name, credits, exigences, description, sections",
                    attendedCourses: "[id.subject+id.number], grade, designation, term, status"
                });


                db.transaction("rw", db.courseBlocks, db.courses, db.attendedCourses, async () => {
                    await db.courseBlocks.bulkPut(processedCourseBlocks);
                    await db.courses.bulkPut(processedCourses);
                    await db.attendedCourses.bulkPut(attendedCourses);
                }).then(() => {
                    setStepCompleted(true);
                }).catch(error => {
                    console.error("Error while saving data to database", error);
                });
            })
            .execute();
    }, [undefined, scraper, setPipelineState, setPipelineError]);

    return (
        <Grid item xs={8} sm={6} md={5}>
            <Step title={"Final step"}>
                {pipelineState === PipelineState.ABORTED &&
                    <Typography variant={"body2"} color={"error"}>
                        An error occurred during the finalization process:
                        {pipelineError?.toString() ?? "Unknown error"}
                    </Typography>
                }
                {pipelineState === PipelineState.RUNNING &&
                    <Stack spacing={2}>
                        <Typography variant={"body1"}>
                            Almost done! Please wait while the tool finalizes the data collection process.
                        </Typography>
                        <CircularProgress size={30}/>
                    </Stack>
                }
                {pipelineState === PipelineState.DONE &&
                    <Stack spacing={2}>
                        <Typography variant={"body2"}>Data collection completed!</Typography>
                        <CheckCircleIcon fontSize={"large"} color={"success"}/>
                    </Stack>
                }
            </Step>
        </Grid>
    );
};

export default DataFinalizationStep;

const courseHistoryUrl = "https://academique-dmz.synchro.umontreal.ca" +
    "/psc/acprpr9/EMPLOYEE/SA/c/SA_LEARNER_SERVICES_2.SSS_MY_CRSEHIST.GBL?Page=SSS_MY_CRSEHIST&Action=U&SRCHPROMPT=N";

const getFollowedCourses = (): FollowedCourse[] => {
    const rows = document.querySelectorAll("tr[id^=trCRSE_HIST\\$0_row]");
    if (!rows) throw new Error("Couldn't find course history rows");

    return Array.from(rows)
        .map(row => {
            const courseId = row.querySelector("span[id^=CRSE_NAME\\$]")?.textContent;
            if (!courseId) throw new Error("Couldn't find course history row's course id");

            const designation = row.querySelector("span[id^=CRSE_DESIG_DESCR\\$]")?.textContent;
            if (!designation) throw new Error("Couldn't find course history row's designation");

            const semester = row.querySelector("span[id^=CRSE_TERM\\$]")?.textContent;
            if (!semester) throw new Error("Couldn't find course history row's semester");

            const gradeSpan = row.querySelector("span[id^=CRSE_GRADE\\$]");
            if (!gradeSpan) throw new Error("Couldn't find course history row's grade");
            const grade = gradeSpan.textContent;
            if (!grade && grade !== "") throw new Error("Couldn't find course history row's grade text");

            const status = row.querySelector("div[id^=win0divCRSE_STATUS\\$] span.sr-only")?.textContent;
            if (!status) throw new Error("Couldn't find course history row's status");

            return {id: courseId, designation, semester, grade, status} satisfies FollowedCourse;
        });
}

const postprocessCourseBlocks = (courseBlocks: CourseBlock[], followedCourses: FollowedCourse[]) => {
    const processedCourseBlocks = getCourseBlocks(courseBlocks);
    const processedCoursed = getCourses(courseBlocks);
    const attendedCourses = getAttendedCourses(followedCourses);
    console.table(followedCourses);

    return {processedCourseBlocks, processedCourses: processedCoursed, attendedCourses};
}

const getAttendedCourseStatus = (followedCourse: FollowedCourse) => {
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

const getAttendedCourses = (followedCourses: FollowedCourse[]) => {
    return followedCourses.map(followedCourse => {
        const courseId = getCourseId(followedCourse.id);

        const [season, year] = followedCourse.semester.split(" ");
        if (!season || !year) throw new Error(`Couldn't parse semester ${followedCourse.semester}`);

        const status = getAttendedCourseStatus(followedCourse);
        return new model.AttendedCourse(
            courseId,
            followedCourse.grade,
            followedCourse.designation,
            `${season} ${parseInt(year)}`,
            status
        );
    });
}

const getCourseId = (courseId: string) => {
    const subject = courseId.replace(/\s/g, "").substring(0, 3);
    const number = parseInt(courseId.substring(3));
    return new model.CourseId(subject, number);
};

const getCourses = (courseBlocks: CourseBlock[]) => {
    return courseBlocks.flatMap(courseBlock =>
        courseBlock.courses.map(course => {
            const courseId = getCourseId(course.id);
            const credits = course.credits;
            const exigences = getCourseExigences(course.exigence);
            const description = course.description ?? "No description available";
            const sections = getSections(course.sections);
            return new model.Course(
                courseId,
                courseBlock.id,
                course.name,
                credits,
                exigences,
                description,
                sections
            );
        })
    );
};

const getTimeOfDay = (time: string) => {
    const [hours, minutes] = time.split(":").map(parseInt);
    return new model.TimeOfDay(hours, minutes);
}

const getDayOfWeek = (day: string) => {
    const lut: Record<string, model.DayOfWeek> = {
        "Lun": model.DayOfWeek.Monday,
        "Mar": model.DayOfWeek.Tuesday,
        "Mer": model.DayOfWeek.Wednesday,
        "J": model.DayOfWeek.Thursday,
        "V": model.DayOfWeek.Friday,
        "S": model.DayOfWeek.Saturday,
        "D": model.DayOfWeek.Sunday
    };
    return lut[day];
}

const getSchedules = (schedules: SectionSchedule[]) => {
    return schedules.map(schedule => {
        const start = getTimeOfDay(schedule.start_time);
        const end = getTimeOfDay(schedule.end_time);
        const timeRange = new model.TimeOfDayRange(start, end);

        const startDate = new Date(schedule.start_date);
        const endDate = new Date(schedule.end_date);
        const dateRange = new model.DateRange(startDate, endDate);

        const day = getDayOfWeek(schedule.day);

        return new model.SectionSchedule(
            timeRange,
            dateRange,
            day,
            schedule.location,
            schedule.teacher
        );
    });
};

const getExams = (exams?: ExamSchedule[]) => {
    if (!exams) return [];

    const examTypeLut: Record<string, "final" | "midterm"> = {
        "intra": "midterm",
        "final": "final"
    };

    return exams.map(exam => {
        const start = getTimeOfDay(exam.start_time);
        const end = getTimeOfDay(exam.end_time);
        const timeRange = new model.TimeOfDayRange(start, end);

        const day = getDayOfWeek(exam.day);

        const date = new Date(exam.date);

        const type = examTypeLut[exam.type];

        return new model.ExamSchedule(timeRange, day, date, exam.location, type);
    });
}

function getSection(section: Section, subSections = {}) {
    const id = section.id.search(/(\(\d+\))/);
    const schedules = getSchedules(section.schedule);
    const exams = getExams(section.exams);
    const finalExam = exams.find(exam => exam.type === "final") ?? null;
    const midtermExam = exams.find(exam => exam.type === "midterm") ?? null;
    return new model.Section(
        id,
        section.status === "open",
        section.type,
        section.campus,
        schedules,
        midtermExam,
        finalExam,
        subSections
    );
}

const getSections = (sections?: Section[]) => {
    if (!sections) return [];

    const subSectionGroups: Record<number, model.Section[]> = {};

    sections
        .filter(section => section.type !== "TH")
        .forEach(section => {
            const sections = getSection(section);
            const subSections = subSectionGroups[section.associated_section_group] ?? [];
            subSections.push(sections);
        });

    return sections
        .filter(section => section.type === "TH")
        .map(section => getSection(section, subSectionGroups[section.associated_section_group]));
}

const getCourseExigences = (exigences?: string) => {
    if (!exigences) return new model.CourseExigences([], []);
    if (exigences.includes("compétence")) return new model.CourseExigences([], []); //TODO
    if (exigences.includes("crédits")) return new model.CourseExigences([], []); //TODO

    const parts = exigences.replace(/Concomitants?: /, "").replace(/Préalables?: /, "").split(" et ");
    const requisites = parts.map(part => {
        if (part.includes(" ou ")) {
            const orParts = part.replace(/[()]/, "").split(" ou ");
            return new model.RequisiteAny(
                orParts.map(getCourseId).map(courseId => new model.CourseRequisite(courseId))
            );
        }
        return new model.CourseRequisite(getCourseId(part));
    });

    if (exigences.includes("Concomitant")) {
        return new model.CourseExigences([], requisites);
    }

    return new model.CourseExigences(requisites, []);
}

const getCourseBlocks = (courseBlocks: CourseBlock[]) => {
    return courseBlocks.map(courseBlock => {
        const coursesId = courseBlock.courses.map(course => getCourseId(course.id));
        const creditsRequirements = getCreditRequirements(courseBlock.credits_requirements);
        return new model.CourseBlock(courseBlock.id, courseBlock.name, creditsRequirements, coursesId);
    });
};

const getCreditRequirements = (creditsRequirements: string) => {
    const parts = creditsRequirements.split(",");
    const requiredCredits = parseFloat(parts[0].split(":")[1]);
    const obtainedCredits = parseFloat(parts[1]);
    return new model.CreditsRequirements(requiredCredits, obtainedCredits);
}