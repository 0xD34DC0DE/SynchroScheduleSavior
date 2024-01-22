import {invoke} from "@tauri-apps/api";

export const create_window = async (label: string, title: string, url: string) =>
    invoke<void>("plugin:webview_injector|create_window", {
        label: label,
        title: title,
        url: url,
    });

export const close_window = async (label: string) =>
    invoke<void>("plugin:webview_injector|close_window", {
        label: label,
    });

type InjectionArgs = {
    injectionTarget: string,
    jsFunction: string,
    jsArgs?: any[],
    executionTimeout?: `${number}ms` | `${number}s`,
}

type PromiseHandle = string;

export const inject = async (args: InjectionArgs): Promise<PromiseHandle> =>
    invoke<PromiseHandle>("plugin:webview_injector|inject", {
        args,
    });

export const await_injection = async <T>(handle: PromiseHandle): Promise<T> =>
    invoke<T>("plugin:webview_injector|await_injection", {
        handle,
    });

export const cancel_injection = async (handle: PromiseHandle) =>
    invoke<void>("plugin:webview_injector|cancel_injection", {
        handle,
    });
