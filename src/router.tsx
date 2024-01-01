import {createBrowserRouter} from "react-router-dom";
import Root from "./routes/Root.tsx";
import LandingPage from "./routes/LandingPage.tsx";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Root/>,
        children: [
            {
                path: "/landing",
                element: <LandingPage/>,
            },
        ],
    },
]);

export default router;
