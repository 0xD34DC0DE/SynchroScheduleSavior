import {createBrowserRouter, createRoutesFromElements, Link, Route, useNavigate} from "react-router-dom";
import Root from "./routes/Root.tsx";
import {Button} from "@mui/material";
import ScraperRouteGuard from "./components/ScraperRouteGuard.tsx";
import {useContext} from "react";
import {ScraperContext} from "./components/ScraperProvider.tsx";

const TMP = ({children}) => {
    const ctx = useContext(ScraperContext);
    return (
        <div>
            {JSON.stringify(ctx, null, 2)}
            {children}
        </div>
    );
};

const router = createBrowserRouter(
    createRoutesFromElements(
        <Route
            path="/"
            element={<Root/>}
        >
            <Route
                index
                element={<Link to={"/test"}>Launch</Link>}
            />
            <ScraperRouteGuard

                windowClosedRedirectPath={"/closed"}
                windowCreateArgs={{
                    label: "synchro",
                    title: "Testing",
                    url: "https://academique-dmz.synchro.umontreal.ca/"
                }}>
                <Route
                    index
                    element={<TMP><Link to={"/closed"}>Go outside Guard</Link></TMP>}
                />
            </ScraperRouteGuard>
            <Route
                path={"/closed"}
                element={<Button onClick={() => useNavigate()("/")}>Closed</Button>}
            />
        </Route>
    )
);

export default router;
