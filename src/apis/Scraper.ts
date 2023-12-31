import {invoke} from "@tauri-apps/api";
import {EventCallback, listen, once as listen_once} from "@tauri-apps/api/event";

type SpecialResult = { ok: "undefined" | "null" | "NaN" | "Infinity" | "-Infinity", special: true };
type OkResult<T> = { ok: T };
type ErrResult = { err: string };
type InjectionResult<T> = SpecialResult | OkResult<T> | ErrResult;
type ExpectedReturnType = "undefined" | "null" | "boolean" | "number" | "string" | "object";

const toConcreteResult = (result: any) => {
    if (typeof result === "object" && result.err !== undefined) {
        throw new Error(result.err);
    }

    if (typeof result === "object" && result.special !== undefined) {
        switch (result.ok) {
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
            default:
                throw new Error(`Unknown special value: ${result.ok}`);
        }
    }

    return result.ok
}

class Scraper {
    private readonly window_label: string;

    private constructor(window_label: string) {
        this.window_label = window_label;
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

    async close() {
        return invoke<void>("close_webview", {
            windowLabel: this.window_label,
        });
    }

    async injectWithArgs<F extends (...args: Parameters<F>) => R, R>(
        fn: F,
        expectedReturnType: ExpectedReturnType,
        timeout_ms: number,
        args: Parameters<F>
    ): Promise<R> {
        return invoke<InjectionResult<ReturnType<F>>>("webview_inject", {
            windowLabel: this.window_label,
            js: fn.toString(),
            args: args,
            timeoutMs: timeout_ms,
            expectedReturnType: expectedReturnType,
        }).then(result => toConcreteResult(result) as R);
    }

    async inject<R>(
        fn: () => R,
        expectedReturnType: ExpectedReturnType,
        timeout_ms: number): Promise<R> {
        return this.injectWithArgs(fn, expectedReturnType, timeout_ms, []);
    }

    async navigateToPath(path: string, timeout_ms: number) {
        return invoke<void>("webview_inject", {
            windowLabel: this.window_label,
            js: `() => { window.location.pathname = '${path}'; }`,
            timeoutMs: timeout_ms,
            expectReturnType: "undefined",
        });
    }

    async onNavigateToUrlOnce(url: string, callback: EventCallback<string>) {
        return invoke<string>("webview_listen_navigation", {
            listenTo: this.window_label,
            url: url,
            once: true,
        }).then((event_name) => {
            const unlisten_fn = listen_once<string>(event_name, callback);
            return async () => {
                await unlisten_fn;
                await invoke<void>("webview_unlisten_navigation", {eventName: event_name})
            };
        });
    }

    async onNavigateToUrl(url: string, callback: EventCallback<string>) {
        return invoke<string>("webview_listen_navigation", {
            listenTo: this.window_label,
            url: url,
            once: false,
        }).then((event_name) => {
            const unlisten_fn = listen<string>(event_name, callback);
            return async () => {
                await unlisten_fn;
                await invoke<void>("webview_unlisten_navigation", {eventName: event_name})
            };
        });
    }

}

export default Scraper;