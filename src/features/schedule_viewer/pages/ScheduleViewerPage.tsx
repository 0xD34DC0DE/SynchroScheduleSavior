import GridLayout from "../../../components/layouts/GridLayout.tsx";
import {Grid2, Tab, Tabs} from "@mui/material";
import {Await, defer, Outlet, useLoaderData} from "react-router-dom";
import {ButtonLink} from "../../../components/navigation";
import {db} from "../../../utils";
import {SemesterEntity} from "../../../models";
import {Suspense} from "react";
import ScheduleViewerLoadError from "../components/ScheduleViewerLoadError.tsx";

interface ScheduleViewerPageProps {

}

const ScheduleViewerPage = ({}: ScheduleViewerPageProps) => {
    const location = useLocation();

    const tab = () => {
        const segments = location.pathname.split("/").pop();
        if (segments === "courses" || segments === "exams") return segments;
        return "courses";
    }
    const data = useLoaderData() as ScheduleViewerPageLoaderData;

    return (
        <GridLayout direction={"column"}>
            <Grid2 size={12} p={1}>
                <Tabs value={tab()} centered sx={{width: "100%"}}>
                    <Tab label={"Courses"} value={"courses"} component={ButtonLink} to={"courses"}/>
                    <Tab label={"Exams"} value={"exams"} component={ButtonLink} to={"exams"}/>
                </Tabs>
            </Grid2>
            <Grid2 container size={12} flex={"1 1 auto"}>
                <Suspense
                    fallback={<Grid2 size={12} p={2} justifyContent={"center"}>Loading...</Grid2>}
                >
                    <Await resolve={data.semesters} errorElement={<ScheduleViewerLoadError/>}>
                        <Outlet/>
                    </Await>
                </Suspense>
            </Grid2>
        </GridLayout>
    );
};

ScheduleViewerPage.loader = async () => {
    console.log("Loading semesters...");
    const semesters = (async () => await db.semesters.toArray())();
    return defer({semesters} satisfies ScheduleViewerPageLoaderData);
}

type ScheduleViewerPageLoaderData = {semesters: Promise<SemesterEntity[]>}

export default ScheduleViewerPage;
