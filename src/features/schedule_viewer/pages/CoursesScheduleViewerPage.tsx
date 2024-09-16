import {Grid2} from "@mui/material";
import Calendar from "../components/Calendar.tsx";
import CoursesPicker from "../components/CoursesPicker.tsx";

interface CoursesScheduleViewerPageProps {

}

const CoursesScheduleViewerPage = ({}: CoursesScheduleViewerPageProps) => {
    return (
        <Grid2 container size={12} p={2} spacing={1} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'row', height: '100%' }}>
            <Grid2 container size={10} sx={{ flexGrow: 1 }}>
                <Calendar/>
            </Grid2>
            <Grid2 container size={2} sx={{ flexGrow: 1, height: '100%', display: 'flex' }}>
                <CoursesPicker/>
            </Grid2>
        </Grid2>
    );
};

export default CoursesScheduleViewerPage;
