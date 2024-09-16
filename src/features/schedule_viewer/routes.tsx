import {Navigate, Route} from "react-router-dom";
import {CoursesScheduleViewerPage, ExamsScheduleViewerPage, ScheduleViewerPage} from "./pages";

const rootPath = "/schedule-viewer";

const routes = (
    <Route path={rootPath} element={<ScheduleViewerPage/>}>
        <Route index element={<Navigate to={"courses"} replace/>}/>
        <Route path={"courses"} element={<CoursesScheduleViewerPage/>}/>
        <Route path={"exams"} element={<ExamsScheduleViewerPage/>}/>
    </Route>
)

export {rootPath, routes};