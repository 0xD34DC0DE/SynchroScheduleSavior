import {createBrowserRouter} from "react-router-dom";
import Root from "./routes/Root.tsx";
import LandingPage from "./routes/LandingPage.tsx";
import DataCollectionPage from "./routes/DataCollectionPage.tsx";
import Testing from "./routes/Testing.tsx";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Root/>,
        children: [
            {
                path: "/test",
                element: <Testing/>,
            },
            {
                path: "/landing",
                element: <LandingPage/>,
            },
            {
                path: "/dashboard",
                element: <div>TODO - Dashboard</div>,
            },
            {
                path: "/data_collection",
                element: <DataCollectionPage/>,
            }
        ],
    },
]);

export default router;
