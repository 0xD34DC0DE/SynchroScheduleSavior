import {invoke} from '@tauri-apps/api/tauri';

const open_webview = async (windowLabel: string, title: string, url: string): Promise<void> => {
    await invoke<void>('open_webview', {windowLabel, title, url});
}

const close_webview = async (windowLabel: string): Promise<void> => {
    await invoke<void>('close_webview', {windowLabel});
}

const webview_inject = async <F extends (...args: Parameters<F>) => ReturnType<F>>(
    targetWindowLabel: string,
    injectionId: number,
    jsFunction: F,
    args: Parameters<F>,
    allowParallel: boolean = false,
): Promise<void> => {
    console.log("(cmd::webview_inject) ", targetWindowLabel, injectionId, jsFunction, args, allowParallel);
    return await invoke('webview_inject', {
        targetWindowLabel,
        injectionId,
        jsFunction: jsFunction.toString(),
        allowParallel,
        args
    });
}

export {
    open_webview,
    close_webview,
    webview_inject
};
