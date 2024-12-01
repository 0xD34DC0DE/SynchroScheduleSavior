import {Grid2, Paper, Typography} from "@mui/material";
import CalendarColumn from "./CalendarColumn.tsx";
import {TimeBlockProvider} from "../context/TimeBlockContext.tsx";
import {useCalendarContext} from "../context/CalendarContext.tsx";
import {DayOfWeek} from "../../../models";

interface CalendarProps {

}

const Calendar = ({}: CalendarProps) => {
    const {timeBlocksPerDay} = useCalendarContext();

    console.log("rendering calendar");

    return (
        <Grid2 container spacing={.5} flexGrow={1} direction={"row"}>
            <TimeBlockProvider dayStartHour={8} dayEndHour={20}>
                {Array.from(timeBlocksPerDay.entries()).map(([day, timeBlocks], i) => {
                    return (
                        <Paper key={i} component={Grid2} container size={12 / 7} flex={"1"} flexDirection={"column"}>
                            <Typography variant="body1" p={1}>{DayOfWeek[day]}</Typography>
                            <CalendarColumn timeBlocks={timeBlocks}/>
                        </Paper>
                    );
                })}
            </TimeBlockProvider>
        </Grid2>
    );
};

export default Calendar;