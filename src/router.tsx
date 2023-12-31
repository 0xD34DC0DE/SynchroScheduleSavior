import {createBrowserRouter} from "react-router-dom";
import Root from "./routes/Root.tsx";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Root/>,
    },
]);

export default router;
