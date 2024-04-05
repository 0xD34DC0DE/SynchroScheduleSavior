import {Await, defer, Outlet, useLoaderData, useResolvedPath} from "react-router-dom";
import ScraperProvider from "./ScraperProvider.tsx";
import {WebScraper} from "../scraper/src/web_scraper.ts";
import {Suspense} from "react";
import ScraperLoadingIndicator from "./ScraperLoadingIndicator.tsx";
import ScraperLoadingError from "./ScraperLoadingError.tsx";

interface ScraperRouteGuardProps {
    windowClosedRedirectPath: string;
}

const ScraperRouteGuard = ({windowClosedRedirectPath}: ScraperRouteGuardProps) => {
    const data = useLoaderData() as {
        web_scraper: any;
    };
    const guard_path = useResolvedPath(".", {relative: "route"});

    return (
        <Suspense fallback={<ScraperLoadingIndicator/>}>
            <Await
                resolve={data.web_scraper}
                errorElement={<ScraperLoadingError/>}
            >
                {(web_scraper: WebScraper) => (
                    <ScraperProvider scraper_context={{web_scraper}}
                                     windowClosedRedirectPath={windowClosedRedirectPath}
                                     guardPath={guard_path.pathname}
                    >
                        <Outlet/>
                    </ScraperProvider>
                )}
            </Await>
        </Suspense>
    );
};

export default ScraperRouteGuard;

export const scraperLoader = (label: string, title: string, url: string) => {
    return async () => defer({
        web_scraper: WebScraper.create(label, title, url)
    });
}
