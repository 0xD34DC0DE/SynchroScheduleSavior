import {scraperLoader, ScraperRouteGuard} from "../../lib/webview_scraper/components";
import {CenteredLayout} from "../../components/layouts";
import {Outlet, Route} from "react-router-dom";
import {IntroductionPage, ScraperClosedPage} from "./pages";
import {DataCollectionStepper, LoginStep, SemesterSelectionStep} from "./components";


const rootPath = "/data-collection";

const routes = (
    <Route
        path={rootPath}
        element={<CenteredLayout children={<Outlet/>}/>}
    >
        <Route index element={<IntroductionPage/>}/>
        <Route
            path={"run"}
            loader={scraperLoader("synchro", "Synchro", "https://academique-dmz.synchro.umontreal.ca/")}
            element={<ScraperRouteGuard windowClosedRedirectPath="closed"/>}
        >
            <Route path="steps/:step" element={<DataCollectionStepper/>}>
                <Route path={"login"} element={<LoginStep/>}/>
                <Route path={"semester-selection"} element={<SemesterSelectionStep/>}/>
            </Route>
        </Route>
        <Route path={"closed"} element={<ScraperClosedPage/>}/>
    </Route>
);

export {rootPath, routes};
