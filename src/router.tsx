import {createBrowserRouter, createRoutesFromElements, Link, Route} from "react-router-dom";
import Root from "./Root.tsx";
import {Routing as DataCollection} from "./features/data_collection";

const routes = createRoutesFromElements(
    <Route
        path="/"
        element={<Root/>}
    >
        <Route index element={<Link to={DataCollection.rootPath}>Start</Link>}/>
        {DataCollection.routes}
    </Route>
);

const router = createBrowserRouter(routes, {future: {v7_relativeSplatPath: true}});

export {routes};
export default router;
