import {Grid2, Paper, Typography} from "@mui/material";
import {useOutletContext} from "react-router-dom";
import {ScheduleViewerOutletContext} from "./ScheduleViewerOutlet.tsx";
import CalendarColumn from "./CalendarColumn.tsx";
import {SectionScheduleEntity} from "../../../models";

interface CalendarProps {

}

const Calendar = ({}: CalendarProps) => {
    const {displayedCourses} = useOutletContext<ScheduleViewerOutletContext>();

    const schedulesPerDay = displayedCourses.reduce((acc, course) => {
        course.sections.forEach(section => {
            section.schedule.forEach(scheduleItem => {
                if (!acc[scheduleItem.day]) acc[scheduleItem.day] = [];
                acc[scheduleItem.day].push(scheduleItem);
            });
            Object.values(section.subSections).forEach(subSection => {
                subSection.schedule.forEach(scheduleItem => {
                    if (!acc[scheduleItem.day]) acc[scheduleItem.day] = [];
                    acc[scheduleItem.day].push(scheduleItem);
                });
            });
        });
        return acc;
    }, {} as Record<number, SectionScheduleEntity[]>);

    return (
        <Grid2 container spacing={.5} flexGrow={1} direction={"row"}>
            {Object.entries(schedulesPerDay).map(([day, schedule], i) => {
                return (
                    <Paper key={i} component={Grid2} container size={12 / 7} flex={"1"} flexDirection={"column"}>
                        <Typography variant="body1" p={1}>{weekdayNames[parseInt(day)]}</Typography>
                        <CalendarColumn schedules={schedule}/>
                    </Paper>
                );
            })}
        </Grid2>
    );
};

export default Calendar;

const weekdayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "TBD"];