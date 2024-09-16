import {getCurrent, WebviewWindow} from "@tauri-apps/api/window";
import {REMOTE_OBJECT_RESOLVER} from "./remote_object.ts";
import makeIIFEStub from "./iife.ts";

class InitiatorWindow extends WebviewWindow {
    static readonly [REMOTE_OBJECT_RESOLVER]: () => InitiatorWindow =
        makeIIFEStub(
            (label: string) => {
                const w = (window.__TAURI__ as unknown as {
                    window: { WebviewWindow: typeof WebviewWindow }
                }).window.WebviewWindow.getByLabel(label);
                if (!w) throw new Error(`Window with label ${label} not found`);
                return w;
            },
            getCurrent().label
        );

}

class TargetWindow extends WebviewWindow {
    static readonly [REMOTE_OBJECT_RESOLVER]: () => TargetWindow =
        makeIIFEStub(
            () => {
                return (window.__TAURI__ as unknown as {
                    window: { getCurrent: () => WebviewWindow }
                }).window.getCurrent();
            }
        );
}

export {InitiatorWindow, TargetWindow};
