import {invoke} from "@tauri-apps/api";

const Scraper = (() => {
    return {
        begin: async (url: string) => invoke<void>("open_puppet", {url}),
        stop: async () => invoke<void>("close_puppet"),
        inject: async <T extends () => R, R>(fn: () => R, timeout_ms: number): Promise<R> => {
            console.log(typeof fn());
            return invoke<ReturnType<T>>("synchro_inject", {
                js: fn.toString(),
                timeoutMs: timeout_ms,
                expectReturnValue: typeof fn() !== 'undefined'
            })
        },
        navigateToPath: async (path: string, timeout_ms: number) =>
            invoke<void>("synchro_inject", {
                js: `() => { window.location.pathname = '${path}'; }`,
                timeoutMs: timeout_ms,
                expectReturnValue: false,
            }),
    }
})();

export default Scraper;