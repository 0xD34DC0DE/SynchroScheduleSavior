import {Dispatch, SetStateAction, Suspense, useState} from "react";
import {CourseEntity} from "../../../models";
import {Await, Outlet, useLoaderData} from "react-router-dom";
import {Grid2} from "@mui/material";
import ScheduleViewerLoadError from "./ScheduleViewerLoadError.tsx";
import {ScheduleViewerPageLoaderData} from "../pages/ScheduleViewerPage.tsx";

interface ScheduleViewerOutletProps {

}

const ScheduleViewerOutlet = ({}: ScheduleViewerOutletProps) => {
    const [courses, setCourses] = useState<CourseEntity[]>([]);
    const data = useLoaderData() as ScheduleViewerPageLoaderData;
    const context = {courses, setCourses} satisfies ScheduleViewerOutletContext;

    return (
        <Suspense
            fallback={<Grid2 size={12} p={2} justifyContent={"center"}>Loading...</Grid2>}
        >
            <Await resolve={data.semesters} errorElement={<ScheduleViewerLoadError/>}>
                <Outlet context={context}/>
            </Await>
        </Suspense>
    );
};

type ScheduleViewerOutletContext = {
    courses: CourseEntity[];
    setCourses: Dispatch<SetStateAction<CourseEntity[]>>;
}

export type {ScheduleViewerOutletContext};
export default ScheduleViewerOutlet;
