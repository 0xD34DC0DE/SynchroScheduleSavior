import {createBrowserRouter, createRoutesFromElements, Link, Route} from "react-router-dom";
import Root from "./Root.tsx";
import {Routing as DataCollection} from "./features/data_collection";
import {Routing as ScheduleViewer} from "./features/schedule_viewer";
import {Stack} from "@mui/material";

const routes = createRoutesFromElements(
    <Route
        path="/"
        element={<Root/>}
    >
        <Route index element={
            <Stack>
                <Link to={DataCollection.rootPath}>Data collection</Link>
                <Link to={ScheduleViewer.rootPath}>Schedule viewer</Link>
            </Stack>
        }/>
        {DataCollection.routes}
        {ScheduleViewer.routes}
    </Route>
);

const router = createBrowserRouter(routes, {future: {v7_relativeSplatPath: true}});

export {routes};
export default router;
