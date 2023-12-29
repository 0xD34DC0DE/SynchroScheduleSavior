import {invoke} from "@tauri-apps/api";

class Scraper {
    private readonly window_label: string;

    private constructor(window_label: string) {
        this.window_label = window_label;
    }

    async inject<T extends () => R, R>(fn: () => R, timeout_ms: number, args?: [any]): Promise<R> {
        console.log(typeof fn());
        return invoke<ReturnType<T>>("webview_inject", {
            windowLabel: this.window_label,
            js: fn.toString(),
            args: args,
            timeoutMs: timeout_ms,
            expectReturnValue: typeof fn() !== "undefined",
        });
    }

    async navigateToPath(path: string, timeout_ms: number) {
        return invoke<void>("webview_inject", {
            windowLabel: this.window_label,
            js: `() => { window.location.pathname = '${path}'; }`,
            timeoutMs: timeout_ms,
            expectReturnValue: false,
        });
    }

    async close() {
        return invoke<void>("close_webview", {
            windowLabel: this.window_label,
        });
    }

    static async open(window_label: string, title: string, url: string): Promise<Scraper> {
        return invoke<void>("open_webview", {
            windowLabel: window_label,
            title: title,
            url: url,
        }).then(() => {
            return new Scraper(window_label);
        })
    }
}

export default Scraper;