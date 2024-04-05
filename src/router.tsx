import {createBrowserRouter, createRoutesFromElements, Link, Route} from "react-router-dom";
import Root from "./routes/Root.tsx";
import {Typography} from "@mui/material";
import ScraperRouteGuard, {scraperLoader} from "./components/ScraperRouteGuard.tsx";
import Testing from "./routes/Testing.tsx";

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
            <Route
                path={"/test"}
                loader={scraperLoader("synchro", "Testing", "https://academique-dmz.synchro.umontreal.ca/")}
                element={<ScraperRouteGuard windowClosedRedirectPath="/closed"/>}
            >
                <Route index element={<Testing/>}/>
                <Route path={"/test/second"} element={<><Testing/><Link to="/test/second/third">Third</Link></>}/>
                <Route path={"/test/second/third"} element={<Link to="/">Root</Link>}/>
            </Route>
            <Route
                path={"/closed"}
                element={<Typography>Scraper closed, <Link to={"/"}>go back</Link></Typography>}
            />
        </Route>
    )
);

export default router;
