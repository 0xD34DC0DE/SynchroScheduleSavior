import {SectionEntity, SectionScheduleEntity, TimeOfDayRangeEntity} from "../../../models";
import {Grid2, Typography} from "@mui/material";
import {useOutletContext} from "react-router-dom";
import {ScheduleViewerOutletContext} from "./ScheduleViewerOutlet.tsx";
import Box from "@mui/material/Box";
import { stringHashToHTMLColor, textColorContrast } from "../utils/color.ts";

interface CalendarColumnProps {
    schedules: SectionScheduleEntity[];
}

const CalendarColumn = ({schedules}: CalendarColumnProps) => {
    const {displayedCourses} = useOutletContext<ScheduleViewerOutletContext>();

    const schedulesByCourse = displayedCourses.reduce((acc, course) => {
        course.sections.forEach(section => {
            section.schedule.forEach(scheduleItem => {
                if (schedules.includes(scheduleItem)) {
                    if (!acc[course.name]) acc[course.name] = [];
                    acc[course.name].push(scheduleItem);
                }
            });
            Object.values(section.subSections).forEach(subSection => {
                subSection.schedule.forEach(scheduleItem => {
                    if (schedules.includes(scheduleItem)) {
                        if (!acc[course.name]) acc[course.name] = [];
                        acc[course.name].push(scheduleItem);
                    }
                });
            });
        });
        return acc;
    }, {} as Record<string, SectionScheduleEntity[]>);

    const timeOfDayRangeToString = (timeRange: TimeOfDayRangeEntity) => {
        return `${timeRange.start.hour}:${timeRange.start.minute} - ${timeRange.end.hour}:${timeRange.end.minute}`;
    }

    const findSection = (schedule: SectionScheduleEntity) => {
        for (const course of displayedCourses) {
            for (const section of course.sections) {
                if (section.schedule.includes(schedule)) {
                    return section;
                }
                for (const subSection of Object.values(section.subSections)) {
                    if (subSection.schedule.includes(schedule)) {
                        return subSection;
                    }
                }
            }
        }
        return undefined;
    }

    type ScheduleParam = {
        bgColor: string;
        color: string;
        key: number;
        time: string;
        courseName: string;
        schedule: SectionScheduleEntity;
        section?: SectionEntity;
    }

    const schedulesParams = Object.entries(schedulesByCourse).flatMap(([courseName, schedules], i): ScheduleParam[] => {
        return schedules.map((schedule, j) => {
                const courseColor = stringHashToHTMLColor(courseName, 0.8);

                return {
                    bgColor: courseColor,
                    color: textColorContrast(courseColor),
                    key: i * 100 + j,
                    time: timeOfDayRangeToString(schedule.timeRange),
                    courseName,
                    schedule,
                    section: findSection(schedule),
                };
            }
        );
    }).filter((param) => {
        if (param.section?.isOpen === false) return false;
        const sectionTypes = {} as Record<string, boolean>;
        for (const subSection of Object.values(param.section?.subSections ?? {})) {
            if (sectionTypes[subSection.type] === undefined) sectionTypes[subSection.type] = false;
            if (subSection.isOpen) sectionTypes[subSection.type] = true;
        }
        return Object.values(sectionTypes).every((isOpen) => isOpen);
    }).sort((a, b) => a.schedule.timeRange.start.isBefore(b.schedule.timeRange.start) ? -1 : 1);

    const adjacentSchedulesByCourses = schedulesParams.reduce((acc, scheduleParam) => {
        if (acc.length === 0) return [[scheduleParam]] as [ScheduleParam][];

        // Group schedules by course
        const lastGroup = acc[acc.length - 1];
        const lastSchedule = lastGroup[lastGroup.length - 1];
        if (lastSchedule.courseName === scheduleParam.courseName &&
            lastSchedule.schedule.timeRange.end.isSame(scheduleParam.schedule.timeRange.end) &&
            lastSchedule.schedule.timeRange.start.isSame(scheduleParam.schedule.timeRange.start)) {
            lastGroup.push(scheduleParam);
        } else {
            acc.push([scheduleParam]);
        }

        return acc;
    }, [] as [ScheduleParam][]);


    const timeOfDayRangeToPercentages = (timeRange: TimeOfDayRangeEntity) => {
        if (timeRange.start.toBeDetermined || timeRange.end.toBeDetermined) return {start: 5, end: 15};
        const start = timeRange.start;
        const end = timeRange.end;
        const dayStart = 8;
        const dayEnd = 20;
        const totalMinutesInDay = (dayEnd - dayStart) * 60;
        const startMinutes = (start.hour - dayStart) * 60 + start.minute;
        const endMinutes = (end.hour - dayStart) * 60 + end.minute;
        return {
            start: (startMinutes / totalMinutesInDay) * 100,
            end: (endMinutes / totalMinutesInDay) * 100
        }
    }

    type ScheduleParamWithTime = ScheduleParam & { start: number, end: number };

    const adjacentSchedulesByCoursesWithTime = adjacentSchedulesByCourses.map(
        (scheduleParam, i): ScheduleParamWithTime[] => {
            if (scheduleParam[0].schedule.timeRange.start.toBeDetermined) {
                return scheduleParam.map((param) => ({
                    ...param,
                    start: (i * 20) % 100,
                    end: (i * 20 + 20) % 100
                } satisfies ScheduleParamWithTime));
            }
            const ranges = timeOfDayRangeToPercentages(scheduleParam[0].schedule.timeRange);
            return scheduleParam.map((param) => ({
                ...param,
                start: ranges.start,
                end: ranges.end
            } satisfies ScheduleParamWithTime));
        }
    );

    return (
        <Grid2 container flexGrow={1} flexDirection={"column"} flexWrap={"nowrap"} position={"relative"}>
            {adjacentSchedulesByCoursesWithTime.map(
                (scheduleParam) => {
                    return (
                        <Box
                            key={scheduleParam[0].key}
                            bgcolor={scheduleParam[0].bgColor}
                            color={scheduleParam[0].color}
                            position={"absolute"}
                            top={scheduleParam[0].start + "%"}
                            bottom={100 - scheduleParam[0].end + "%"}
                            left={0}
                            right={0}
                        >
                            <Typography variant="body1"
                                        p={0.5}>{scheduleParam[0].courseName} - {scheduleParam[0].time}</Typography>
                            {scheduleParam.map((param) => (
                                <Grid2 key={param.key}>
                                    <Typography variant="body2" p={1}>{param.section?.id}</Typography>
                                </Grid2>
                            ))}
                        </Box>
                    );
                }
            )}
        </Grid2>
    );
};

export default CalendarColumn;
