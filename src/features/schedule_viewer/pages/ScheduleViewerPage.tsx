import GridLayout from "../../../components/layouts/GridLayout.tsx";
import {Grid2, Tab, Tabs} from "@mui/material";
import {Outlet, useLocation} from "react-router-dom";
import {ButtonLink} from "../../../components/navigation";

interface ScheduleViewerPageProps {

}

const ScheduleViewerPage = ({}: ScheduleViewerPageProps) => {
    const location = useLocation();

    const tab = () => {
        const segments = location.pathname.split("/").pop();
        if (segments === "courses" || segments === "exams") return segments;
        return "courses";
    }

    return (
        <GridLayout direction={"column"}>
            <Grid2 size={12} p={1}>
                <Tabs value={tab()} centered sx={{width: "100%"}}>
                    <Tab label={"Courses"} value={"courses"} component={ButtonLink} to={"courses"}/>
                    <Tab label={"Exams"} value={"exams"} component={ButtonLink} to={"exams"}/>
                </Tabs>
            </Grid2>
            <Grid2 container size={12} flex={"1 1 auto"}>
                <Outlet/>
            </Grid2>
        </GridLayout>
    );
};

export default ScheduleViewerPage;
