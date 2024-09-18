import GridLayout from "../../../components/layouts/GridLayout.tsx";
import {Grid2, Tab, Tabs} from "@mui/material";
import {defer, useMatch} from "react-router-dom";
import {ButtonLink} from "../../../components/navigation";
import {db} from "../../../utils";
import {SemesterEntity} from "../../../models";
import ScheduleViewerOutlet from "../components/ScheduleViewerOutlet.tsx";

interface ScheduleViewerPageProps {

}

const ScheduleViewerPage = ({}: ScheduleViewerPageProps) => {
    const match = useMatch("/schedule-viewer/:tab");
    const tab = match?.params.tab ?? "courses";

    return (
        <GridLayout direction={"column"}>
            <Grid2 size={12} p={1}>
                <Tabs value={tab} centered sx={{width: "100%"}}>
                    <Tab label={"Courses"} value={"courses"} component={ButtonLink} to={"courses"}/>
                    <Tab label={"Exams"} value={"exams"} component={ButtonLink} to={"exams"}/>
                </Tabs>
            </Grid2>
            <Grid2 container size={12} flex={"1 1 auto"}>
                <ScheduleViewerOutlet/>
            </Grid2>
        </GridLayout>
    );
};

ScheduleViewerPage.loader = async () => {
    const semesters = (async () => await db.semesters.toArray())();
    return defer({semesters} satisfies ScheduleViewerPageLoaderData);
}

type ScheduleViewerPageLoaderData = { semesters: Promise<SemesterEntity[]> }

export type {ScheduleViewerPageLoaderData};
export default ScheduleViewerPage;
