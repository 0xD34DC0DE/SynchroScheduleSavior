import {Grid2, Paper, Typography} from "@mui/material";

interface CalendarProps {

}

const Calendar = ({}: CalendarProps) => {
    return (
        <Grid2 container spacing={1} flexGrow={1} direction={"row"}>
            {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day, i) => (
                <Paper key={i} component={Grid2} size={12/7} flexGrow={1} display={"flex"} justifyContent={"center"}>
                    <Typography variant="body1" p={1}>{day}</Typography>
                </Paper>
            ))}
        </Grid2>
    );
};

export default Calendar;
