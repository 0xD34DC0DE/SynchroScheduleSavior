import {WebviewWindow} from "@tauri-apps/api/window";

/**
 * The label used to identify the window that initiated the scraper
 * @see [injection_handler.js]{@link https://github.com/0xD34DC0DE/SynchroScheduleSavior/blob/e701df6ac78925c3b31fae8b036994f170257846/src-tauri/src/webview_inject/injection_handler.js}
 */
declare const initiator_label: string;

declare global {
    interface Window {
        __TAURI__: {
            window: {
                WebviewWindow: typeof WebviewWindow
            }
        }
    }
}

class Context {
    public get initiator(): WebviewWindow {
        const initiator = window.__TAURI__.window.WebviewWindow.getByLabel(initiator_label);
        if (!initiator) {
            throw new Error("Could not find initiator window with label: " + initiator_label);
        }
        return initiator;
    }
}

interface ContextFactory<Ctx extends Context> {
    create(): Ctx;
}

const defaultContextFactory: ContextFactory<Context> = {
    create: () => new Context()
};

export {Context, defaultContextFactory};
export type {ContextFactory};
