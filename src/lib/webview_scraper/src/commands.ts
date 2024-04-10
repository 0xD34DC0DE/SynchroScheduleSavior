import {invoke} from '@tauri-apps/api/tauri';
import {WebviewWindow} from "@tauri-apps/api/window";

const open_webview = async (windowLabel: string, title: string, url: string): Promise<void> => {
    await invoke<void>('open_webview', {windowLabel, title, url});
}

const close_webview = async (windowLabel: string): Promise<void> => {
    await invoke<void>('close_webview', {windowLabel});
}

const webview_inject = async(
    targetWindowLabel: string,
    injectionId: number,
    jsFunction: string,
    args: any[] = [],
    allowParallel: boolean = false,
    contextClasses?: Function[],
): Promise<void> => {
    const cmd_args = {
        targetWindowLabel,
        injectionId,
        jsFunction,
        allowParallel,
        args,
        contextClasses: contextClasses?.map((c) => c.toString()),
    };
    console.log("(cmd::webview_inject) cmd_args:", cmd_args);
    return await invoke('webview_inject', cmd_args);
}

//FIXME: This is a workaround for a bug in Tauri's WebviewWindow.getByLabel API
// https://github.com/tauri-apps/tauri/issues/5380
const get_window_by_label = async (windowLabel: string): Promise<WebviewWindow | null> => {
    const exists = await invoke<boolean>('window_exists', {windowLabel});
    if (!exists) return null;

    return new WebviewWindow(windowLabel, {
        //@ts-ignore (skip is private API, but necessary for the workaround)
        skip: true
    });
}

export {
    open_webview,
    close_webview,
    webview_inject,
    get_window_by_label,
};
