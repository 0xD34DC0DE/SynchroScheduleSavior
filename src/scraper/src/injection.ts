import {WebviewWindow} from "@tauri-apps/api/window";
import {UnlistenFn} from "@tauri-apps/api/event";
import {webview_inject} from "./commands.ts";


type UnserializableValueTag = "undefined" | "null" | "NaN" | "Infinity" | "-Infinity";

type Unserializable = {
    value: UnserializableValueTag;
    unserializable: true;
};

type Ok<T> = { value: T; };

type Err = { error: string; };

export type InjectionResult<T> = Ok<T> | Err;
type RawInjectionResult<T> = Unserializable | InjectionResult<T>;

const resolved_values: Record<UnserializableValueTag, any> = {
    "undefined": undefined,
    "null": null,
    "NaN": NaN,
    "Infinity": Infinity,
    "-Infinity": -Infinity,
};

const resolve_unserializable_type = <T>(result: Unserializable): Ok<T> => {
    if (!(result.value in resolved_values)) {
        throw new Error(`Unknown unserializable value tag: ${result.value}`);
    }

    return {
        value: resolved_values[result.value]
    };
}

const process_raw_injection_result = <T>(result: RawInjectionResult<T>): InjectionResult<T> => {
    if ("unserializable" in result) return resolve_unserializable_type(result);
    return result;
}

const noop = () => {
};

export class Injection<F extends (...args: Parameters<F>) => ReturnType<F>> {
    private readonly _injection_id: number;

    constructor(
        private readonly js_function: F,
        private readonly args: Parameters<F>,
        private readonly allow_parallel: boolean,
    ) {
        this._injection_id = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    }

    public async inject(
        target: WebviewWindow,
        on_result: (result: InjectionResult<ReturnType<F>>) => void = noop,
    ): Promise<UnlistenFn> {
        return target.once<RawInjectionResult<ReturnType<F>>>(
            this._injection_id.toString(),
            (event) => on_result(process_raw_injection_result(event.payload))
        ).then(async unlisten => {
            try {
                await webview_inject(target.label, this._injection_id, this.js_function, this.args, this.allow_parallel);
            } catch (e) {
                unlisten();
                throw e;
            }
            return unlisten;
        });
    }
}
