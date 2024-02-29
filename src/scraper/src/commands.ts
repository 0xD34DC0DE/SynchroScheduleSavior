import {invoke} from '@tauri-apps/api/tauri';

const open_webview = async (windowLabel: string, title: string, url: string): Promise<void> => {
    await invoke<void>('open_webview', {windowLabel, title, url});
}

const close_webview = async (windowLabel: string): Promise<void> => {
    await invoke<void>('close_webview', {windowLabel});
}


type Serializable = string | number | boolean | null | Serializable[] | { [key: string]: Serializable };

const webview_inject = async <F extends (...args: Parameters<F>) => ReturnType<F>, T extends ReturnType<F>>(
    targetWindowLabel: string,
    injectionId: number,
    jsFunction: F,
    args: Parameters<F>,
    allowParallel: boolean = false,
): Promise<ReturnType<F>> => {
    return await invoke<T>('webview_inject', {
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

export type {Serializable};
