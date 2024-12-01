import {Grid2} from "@mui/material";
import CourseTimeBlock from "./CourseTimeBlock.tsx";
import CalendarTimeBlock from "../models/CalendarTimeBlock.ts";

interface CalendarColumnProps {
    timeBlocks: CalendarTimeBlock[];
}

const CalendarColumn = ({timeBlocks}: CalendarColumnProps) => {

    // const schedulesByCourse = displayedCourses.reduce((acc, course) => {
    //     course.sections.forEach(section => {
    //         section.schedule.forEach(scheduleItem => {
    //             if (schedules.includes(scheduleItem)) {
    //                 if (!acc[course.name]) acc[course.name] = [];
    //                 acc[course.name].push(scheduleItem);
    //             }
    //         });
    //         Object.values(section.subSections).forEach(subSection => {
    //             subSection.schedule.forEach(scheduleItem => {
    //                 if (schedules.includes(scheduleItem)) {
    //                     if (!acc[course.name]) acc[course.name] = [];
    //                     acc[course.name].push(scheduleItem);
    //                 }
    //             });
    //         });
    //     });
    //     return acc;
    // }, {} as Record<string, SectionScheduleEntity[]>);

    // const findSection = (schedule: SectionScheduleEntity) => {
    //     for (const course of displayedCourses) {
    //         for (const section of course.sections) {
    //             if (section.schedule.includes(schedule)) {
    //                 return section;
    //             }
    //             for (const subSection of Object.values(section.subSections)) {
    //                 if (subSection.schedule.includes(schedule)) {
    //                     return subSection;
    //                 }
    //             }
    //         }
    //     }
    //     return undefined;
    // }
    //
    // type ScheduleParam = {
    //     bgColor: string;
    //     color: string;
    //     key: number;
    //     time: string;
    //     courseName: string;
    //     schedule: SectionScheduleEntity;
    //     section?: SectionEntity;
    // }
    //
    // const schedulesParams = Object.entries(schedulesByCourse).flatMap(([courseName, schedules], i): ScheduleParam[] => {
    //     return schedules.map((schedule, j) => {
    //             const courseColor = stringHashToHTMLColor(courseName, 0.8);
    //
    //             return {
    //                 bgColor: courseColor,
    //                 color: textColorContrast(courseColor),
    //                 key: i * 100 + j,
    //                 time: timeOfDayRangeToString(schedule.timeRange),
    //                 courseName,
    //                 schedule,
    //                 section: findSection(schedule),
    //             };
    //         }
    //     );
    // }).filter((param) => {
    //     if (param.section?.isOpen === false) return false;
    //     const sectionTypes = {} as Record<string, boolean>;
    //     for (const subSection of Object.values(param.section?.subSections ?? {})) {
    //         if (sectionTypes[subSection.type] === undefined) sectionTypes[subSection.type] = false;
    //         if (subSection.isOpen) sectionTypes[subSection.type] = true;
    //     }
    //     return Object.values(sectionTypes).every((isOpen) => isOpen);
    // }).sort((a, b) => a.schedule.timeRange.start.isBefore(b.schedule.timeRange.start) ? -1 : 1);
    //
    // const adjacentSchedulesByCourses = schedulesParams.reduce((acc, scheduleParam) => {
    //     if (acc.length === 0) return [[scheduleParam]] as [ScheduleParam][];
    //
    //     // Group schedules by course
    //     const lastGroup = acc[acc.length - 1];
    //     const lastSchedule = lastGroup[lastGroup.length - 1];
    //     if (lastSchedule.courseName === scheduleParam.courseName &&
    //         lastSchedule.schedule.timeRange.end.isSame(scheduleParam.schedule.timeRange.end) &&
    //         lastSchedule.schedule.timeRange.start.isSame(scheduleParam.schedule.timeRange.start)) {
    //         lastGroup.push(scheduleParam);
    //     } else {
    //         acc.push([scheduleParam]);
    //     }
    //
    //     return acc;
    // }, [] as [ScheduleParam][]);
    //
    // type ScheduleParamWithTime = ScheduleParam & { start: number, end: number };
    //
    // const adjacentSchedulesByCoursesWithTime = adjacentSchedulesByCourses.map(
    //     (scheduleParam, i): ScheduleParamWithTime[] => {
    //         if (scheduleParam[0].schedule.timeRange.start.toBeDetermined) {
    //             return scheduleParam.map((param) => ({
    //                 ...param,
    //                 start: (i * 20) % 100,
    //                 end: (i * 20 + 20) % 100
    //             } satisfies ScheduleParamWithTime));
    //         }
    //         const {
    //             top,
    //             bottom
    //         } = useTimeBlockPosition(scheduleParam[0].time.split(' - ')[0], scheduleParam[0].time.split(' - ')[1]);
    //         return scheduleParam.map((param) => ({
    //             ...param,
    //             start: top,
    //             end: bottom
    //         } satisfies ScheduleParamWithTime));
    //     }
    // );

    return (
        <Grid2 container flexGrow={1} flexDirection={"column"} flexWrap={"nowrap"} position={"relative"}>
            {timeBlocks.map(
                (timeBlock) =>
                    <CourseTimeBlock key={timeBlock.courseId} timeBlock={timeBlock}/>
            )}
        </Grid2>
    );
};

export default CalendarColumn;
