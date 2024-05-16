import {WebviewWindow} from "@tauri-apps/api/window";
import makeIIFEStub from "./iife.ts";
import InjectableStub from "./types.ts";

declare const initiator: unique symbol;

type InitiatorWindow = WebviewWindow & { [initiator]: string };

declare const target: unique symbol;

type TargetWindow = WebviewWindow & { [target]: true };

const getResolver = (webview_window: InitiatorWindow | TargetWindow): InjectableStub<() => WebviewWindow> => {
    if (initiator in webview_window) {
        return makeIIFEStub((label) => {
            const w = (window.__TAURI__ as unknown as { window: { WebviewWindow: typeof WebviewWindow } })
                .window.WebviewWindow.getByLabel(label);
            if (!w) throw new Error(`Window with label ${label} not found`);
            return w;
        }, webview_window[initiator]) as InjectableStub<() => WebviewWindow>;
    }

    if (target in webview_window) {
        return makeIIFEStub(() => {
            return (window.__TAURI__ as unknown as { window: { getCurrent: () => WebviewWindow } }).window.getCurrent();
        }) as InjectableStub<() => WebviewWindow>;
    }

    throw new Error("Invalid window type");
}

export type {InitiatorWindow, TargetWindow};
export {getResolver};
