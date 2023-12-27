import {invoke} from "@tauri-apps/api";

const Scraper = (() => {
    return {
        begin: async (url: string) => invoke("open_puppet", {url}),
        stop: async () =>  invoke("close_puppet"),
        inject: async <T extends () => R, R>(fn: () => R, timeout_ms: number): Promise<R> => {
            return invoke<ReturnType<T>>("synchro_inject", {js: fn.toString(), timeoutMs: timeout_ms});
        },
        navigateToPath: async (path: string, timeout_ms: number) => invoke("synchro_inject", {
            js: `() => { window.location.pathname = '${path}' }`,
            timeoutMs: timeout_ms
        }),
    }
})();

export default Scraper;