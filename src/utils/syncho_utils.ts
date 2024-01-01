import Scraper from "../apis/Scraper.ts";

// Stubs for functions that are defined in Synchro
declare function pingServer(url: string): void;
declare function setupTimeout2(): void;
declare function closeLastModal(): void;


export const sessionKeepAlive = async (scraper: Scraper) => {
    await scraper.inject(() => {
        pingServer(window.location.href.replace(/(['"\\])/g, "\\$&"));
        setupTimeout2();
        closeLastModal();
    }, "undefined", 1000).catch(e => console.error(e));
}

export const showLoggedInModal = async (scraper: Scraper, message: string) => {
    const fn = (message: string) => {
        $("body").append(
            $("<div>")
                .attr("id", "synchro-logged-in-modal")
                .html(message)
                .css({
                    "position": "fixed",
                    "display": "flex",
                    "justify-content": "center",
                    "align-items": "center",
                    "width": "100%",
                    "height": "100%",
                    "top": "0",
                    "left": "0",
                    "right": "0",
                    "bottom": "0",
                    "background-color": "rgba(0,0,0,0.5)",
                    "backdrop-filter": "blur(5px)",
                    "z-index": "9999",
                })
        );
    }

    await scraper.injectWithArgs(fn, "undefined", 500, [message])
        .catch(e => console.error(e));
}