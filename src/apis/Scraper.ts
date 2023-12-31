import {invoke} from "@tauri-apps/api";

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

    async injectWithArgs<F extends (...args: Parameters<F>) => R, R>(
        fn: F,
        expectedReturnType: ExpectedReturnType,
        timeout_ms: number,
        args: Parameters<F>
    ): Promise<R>
    {
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
        timeout_ms: number): Promise<R>
    {
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

    async close() {
        return invoke<void>("close_webview", {
            windowLabel: this.window_label,
        });
    }
}

export default Scraper;