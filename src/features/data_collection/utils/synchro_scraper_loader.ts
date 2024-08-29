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
                            pingServer(window.location.href.replace(/(['"\\])/g, "\\$&"));
                            setupTimeout2();
                            console.log("Session refreshed");
                        }, 1000 * 60 * 5);
                    },
                    []
                )
        }
    ]
);

declare function pingServer(url: string): void;
declare function setupTimeout2(): void;
declare global {
    interface Window {
        _session_refresher: ReturnType<typeof setInterval>;
    }
}

export {synchroScraperLoader};