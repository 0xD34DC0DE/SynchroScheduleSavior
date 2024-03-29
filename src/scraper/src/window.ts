import {close_webview, open_webview, webview_inject} from "./commands.ts";
import {WebviewWindow} from "@tauri-apps/api/window";
import {UnlistenFn} from "@tauri-apps/api/event";
import {InjectionResult, process_raw_injection_result, RawInjectionResult} from "./injection.ts";


export class InjectableWindow {
    private readonly window_label: string;
    private readonly navigation_listener: Promise<UnlistenFn>;
    private readonly close_listener: Promise<UnlistenFn>;

    static async create(label: string, title: string, url: string): Promise<InjectableWindow> {
        await open_webview(label, title, url);
        return new InjectableWindow(label);
    }

    public async close(): Promise<void> {
        await close_webview(this.window_label);
    }

    private constructor(label: string) {
        this.window_label = label;
        this.navigation_listener = this.on_navigation(this.handle_navigation);
        this.close_listener = this.on_close(this.handle_close);
    }

    private get underlying_window(): WebviewWindow {
        const window = WebviewWindow.getByLabel(this.window_label);
        if (!window) throw new Error(`Window '${this.window_label}' not found`);
        return window;
    }

    public async on_navigation(callback: (url: string) => void): Promise<UnlistenFn> {
        return await this.underlying_window.listen<{ url: string }>(
            "navigation",
            (event) => callback(event.payload.url)
        );
    }

    private handle_navigation(_url: string) {
        //console.log("URL:", url);
    }

    public async on_close(callback: () => void): Promise<UnlistenFn> {
        return await this.underlying_window.listen("tauri://close-requested", callback);
    }

    private handle_close() {
        console.log("Window closed");
        this.navigation_listener.then(unlisten => unlisten());
        this.close_listener.then(unlisten => unlisten());
    }

    public async inject<F extends (...args: Parameters<F>) => ReturnType<F>>(
        jsFunction: F,
        args: Parameters<F>,
        on_result: (result: InjectionResult<ReturnType<F>>) => void = () => {},
        allowParallel: boolean = false,
    ): Promise<UnlistenFn> {
        return new Promise<UnlistenFn>(async (resolve, reject) => {
            const injection_id = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
            console.log("(InjectableWindow) starting listener for injection id: ", injection_id);
            this.underlying_window.once<RawInjectionResult<ReturnType<F>>>(
                injection_id.toString(),
                (event) => {
                    console.log("(InjectableWindow) injection result received", event.payload);
                    console.log("(InjectableWindow) calling on_result");
                    on_result(process_raw_injection_result(event.payload));
                }
            ).then(async unlisten => {
                try {
                    console.log("(InjectableWindow) listener ready");
                    console.log("(InjectableWindow) injecting");
                    await webview_inject(
                        this.window_label,
                        injection_id,
                        jsFunction,
                        args,
                        allowParallel
                    );
                    console.log("(InjectableWindow) injection complete, returning unlisten function");
                    return resolve(unlisten);
                } catch (e) {
                    unlisten();
                    reject(e);
                }
            })
        });
    }
}
