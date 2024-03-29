import {close_webview, open_webview} from "./commands.ts";
import {WebviewWindow} from "@tauri-apps/api/window";
import {UnlistenFn} from "@tauri-apps/api/event";


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

    private handle_navigation(url: string) {
        console.log("URL:", url);
    }

    public async on_close(callback: () => void): Promise<UnlistenFn> {
        return await this.underlying_window.listen("tauri://close-requested", callback);
    }

    private handle_close() {
        console.log("Window closed");
        this.navigation_listener.then(unlisten => unlisten());
        this.close_listener.then(unlisten => unlisten());
    }
}
