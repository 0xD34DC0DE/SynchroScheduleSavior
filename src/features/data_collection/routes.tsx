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
        <Route index element={<IntroductionPage startPath={"steps"}/>}/>
        <Route
            path={"steps"}
            loader={scraperLoader("synchro", "Synchro", "https://academique-dmz.synchro.umontreal.ca/")}
            element={<ScraperRouteGuard windowClosedRedirectPath="closed"/>}
        >
            <Route
                path={"*"}
                element={<DataCollectionStepper onCompletionPath={"./../../completed"}/>}
            >
                <Route index element={<LoginStep/>}/>
                <Route path={"semester-selection"} element={<SemesterSelectionStep/>}/>
            </Route>
        </Route>
        <Route path={"closed"} element={<ScraperClosedPage/>}/>
        <Route path={"completed"} element={<h1>Completed</h1>}/>
    </Route>
);

export {rootPath, routes};
