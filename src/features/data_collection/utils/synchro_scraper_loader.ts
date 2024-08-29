import {scraperLoader} from "../../../lib/webview_scraper";

const synchroScraperLoader = scraperLoader(
    "synchro",
    "Synchro",
    "https://academique-dmz.synchro.umontreal.ca/",
    [
        {
            url_pattern: "https\\://academique-dmz.synchro.umontreal.ca/psc/*",
            pipelineSteps: (pipeline) =>
                pipeline.task(
                    () => {
                        if (window._session_refresher) return;
                        window._session_refresher = setInterval(() => {
                            fetch(sRCRequestURL).then(() => setupTimeout2());
                        }, warningTimeoutMilliseconds - 1000 * 60);
                    },
                    []
                )
        }
    ]
);

declare const warningTimeoutMilliseconds: number; // Session warning timeout in milliseconds
declare const sRCRequestURL: string; // Token refresh URL
declare function setupTimeout2(): void; // Reset session warning timeout
declare global {
    interface Window {
        _session_refresher: ReturnType<typeof setInterval>;
    }
}

export {synchroScraperLoader};