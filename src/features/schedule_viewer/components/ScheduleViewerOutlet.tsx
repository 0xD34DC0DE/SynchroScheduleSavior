import {Dispatch, SetStateAction, Suspense} from "react";
import {CourseEntity} from "../../../models";
import {Await, Outlet, useLoaderData} from "react-router-dom";
import {Grid2} from "@mui/material";
import ScheduleViewerLoadError from "./ScheduleViewerLoadError.tsx";
import {ScheduleViewerPageLoaderData} from "../pages/ScheduleViewerPage.tsx";
import {CalendarProvider} from "../context/CalendarContext.tsx";

interface ScheduleViewerOutletProps {

}

const ScheduleViewerOutlet = ({}: ScheduleViewerOutletProps) => {
    const data = useLoaderData() as ScheduleViewerPageLoaderData;

    return (
        <Suspense
            fallback={<Grid2 size={12} p={2} justifyContent={"center"}>Loading...</Grid2>}
        >
            <Await resolve={data.semesters} errorElement={<ScheduleViewerLoadError/>}>
                {(semesters: Awaited<typeof data.semesters>) =>
                    <CalendarProvider semesters={semesters}>
                        <Outlet/>
                    </CalendarProvider>
                }
            </Await>
        </Suspense>
    );
};

type ScheduleViewerOutletContext = {
    displayedCourses: CourseEntity[];
    setDisplayedCourses: Dispatch<SetStateAction<CourseEntity[]>>;
}

export type {ScheduleViewerOutletContext};
export default ScheduleViewerOutlet;
