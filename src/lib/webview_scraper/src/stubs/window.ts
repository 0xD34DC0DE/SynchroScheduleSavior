import {getCurrent, WebviewWindow} from "@tauri-apps/api/window";
import makeIIFEStub from "./iife.ts";
import {ResolvableClass} from "./resolvable.ts";

class InitiatorWindow extends WebviewWindow implements ResolvableClass<() => WebviewWindow> {
    resolve(): () => WebviewWindow {
        return makeIIFEStub((label) => {
            const w = (window.__TAURI__ as unknown as { window: { WebviewWindow: typeof WebviewWindow } })
                .window.WebviewWindow.getByLabel(label);
            if (!w) throw new Error(`Window with label ${label} not found`);
            return w;
        }, getCurrent().label);
    }
}

class TargetWindow extends WebviewWindow implements ResolvableClass<() => WebviewWindow> {
    resolve(): () => WebviewWindow {
        return makeIIFEStub(() => {
            return (window.__TAURI__ as unknown as { window: { getCurrent: () => WebviewWindow } }).window.getCurrent();
        });
    }
}

export type {InitiatorWindow, TargetWindow};
