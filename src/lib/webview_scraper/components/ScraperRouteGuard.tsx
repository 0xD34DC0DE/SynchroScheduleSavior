import {Await, defer, Outlet, useLoaderData, useResolvedPath} from "react-router-dom";
import ScraperProvider from "./ScraperProvider.tsx";
import WebScraper from "../src/web_scraper.ts";
import {ReactNode, Suspense} from "react";
import ScraperLoadingIndicator from "./ScraperLoadingIndicator.tsx";
import ScraperLoadingError from "./ScraperLoadingError.tsx";

interface ScraperRouteGuardProps {
    windowClosedRedirectPath: string;
    errorElement?: ReactNode;
}

const ScraperRouteGuard = ({windowClosedRedirectPath, errorElement}: ScraperRouteGuardProps) => {
    const data = useLoaderData() as {
        web_scraper: any;
    };
    const guard_path = useResolvedPath(".", {relative: "route"});

    return (
        <Suspense fallback={<ScraperLoadingIndicator/>}>
            <Await
                resolve={data.web_scraper}
                errorElement={errorElement === undefined ? <ScraperLoadingError/> : errorElement}
            >
                {(web_scraper: WebScraper) => (
                    <ScraperProvider scraperContext={{web_scraper}}
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
