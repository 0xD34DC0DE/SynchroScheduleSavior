import {ScraperRouteGuard} from "../../lib/webview_scraper/components";
import {Route} from "react-router-dom";
import {IntroductionPage, ScraperErrorPage, ExplanationPage, ScraperClosedPage} from "./pages";
import {DataCollectionStepper, LoginStep, SemesterSelectionStep, CenteredGridLayout} from "./components";
import SemestersDataCollectionStep from "./components/SemestersDataCollectionStep.tsx";
import {synchroScraperLoader} from "./utils/synchro_scraper_loader.ts";
import DataFinalizationStep from "./components/DataFinalizationStep.tsx";

const rootPath = "/data-collection";

const routes = (
    <Route
        path={rootPath}
        element={<CenteredGridLayout/>}
        errorElement={<ScraperErrorPage/>}
    >
        <Route index element={<IntroductionPage linkPath="explanation"/>}/>
        <Route path={"explanation"} element={<ExplanationPage startPath="../steps"/>}/>
        <Route
            path={"steps"}
            loader={synchroScraperLoader}
            element={<ScraperRouteGuard windowClosedRedirectPath="./../closed" errorElement={null}/>}
        >
            <Route
                path={"*"}
                element={<DataCollectionStepper onCompletionPath={"./../../completed"}/>}
            >
                <Route index element={<LoginStep/>}/>
                <Route path={"semester-selection"} element={<SemesterSelectionStep/>}/>
                <Route path={"semester-data-collection"} element={<SemestersDataCollectionStep/>}/>
                <Route path={"finalization"} element={<DataFinalizationStep/>}/>
            </Route>
        </Route>
        <Route path={"closed"} element={<ScraperClosedPage/>}/>
        <Route path={"completed"} element={<h1>Completed</h1>}/>
    </Route>
);

export {rootPath, routes};
