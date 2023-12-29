import {invoke} from "@tauri-apps/api";

type SpecialResult = { "special": "undefined" | "null" | "NaN" | "Infinity" | "-Infinity" };
type InjectionResult<T> = T | SpecialResult;
type ExpectedReturnType = "undefined" | "null" | "boolean" | "number" | "string" | "object";

const toConcreteResult = (result: any) => {
    if (typeof result === "object" && result.special !== undefined) {
        switch (result.special) {
            case "undefined":
                return undefined;
            case "null":
                return null;
            case "NaN":
                return NaN;
            case "Infinity":
                return Infinity;
            case "-Infinity":
                return -Infinity;
        }
    }
    return result;
}

class Scraper {
    private readonly window_label: string;

    private constructor(window_label: string) {
        this.window_label = window_label;
    }

    async inject<T extends () => R, R>(fn: () => R, expectedReturnType: ExpectedReturnType, timeout_ms: number, args?: [any], ): Promise<R> {
        return invoke<InjectionResult<ReturnType<T>>>("webview_inject", {
            windowLabel: this.window_label,
            js: fn.toString(),
            args: args,
            timeoutMs: timeout_ms,
            expectedReturnType: expectedReturnType,
        }).then(result => toConcreteResult(result) as R);
    }

    async navigateToPath(path: string, timeout_ms: number) {
        return invoke<void>("webview_inject", {
            windowLabel: this.window_label,
            js: `() => { window.location.pathname = '${path}'; }`,
            timeoutMs: timeout_ms,
            expectReturnType: "undefined",
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