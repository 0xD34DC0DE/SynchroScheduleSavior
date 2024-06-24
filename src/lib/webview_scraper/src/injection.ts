import {WebviewWindow} from "@tauri-apps/api/window";
import {UnlistenFn} from "@tauri-apps/api/event";
import {webview_inject} from "./commands.ts";
import {uniqueEventId} from "./utils.ts";
import toEJSON from "./ejson.ts";
import {Resolved} from "./stubs/resolvable.ts";

type UnserializableValueTag = "undefined" | "null" | "NaN" | "Infinity" | "-Infinity";

type Ok<T> = { value: T; };
type Err = { error: string; };
type Unserializable = {
    value: UnserializableValueTag;
    unserializable: true;
};

type InjectionResult<T> = Ok<T> | Err;
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


type ResolvedParameters<T> =
    T extends (...args: infer Args) => any
        ? ResolvedType<Args>
        : never;

class Injection<F extends (...args: any[]) => any> {
    private readonly _injection_id: number;

    constructor(
        private readonly js_function: F,
        private readonly args: ResolvedParameters<F>,
        private readonly options?: {
            allow_parallel?: boolean;
        }
    ) {
        this._injection_id = uniqueEventId();
    }

    public async inject(
        target: WebviewWindow,
        on_result?: (result: InjectionResult<ReturnType<F>>) => void,
    ): Promise<UnlistenFn> {
        return target.once<RawInjectionResult<ReturnType<F>>>(
            this._injection_id.toString(),
            (event) => on_result?.(process_raw_injection_result(event.payload))
        ).then(async unlisten => {
            try {
                await webview_inject(target.label, {
                    injectionId: this._injection_id,
                    jsFunction: toEJSON(this.js_function),
                    functionArgs: toEJSON(this.args),
                    allowParallel: this.options?.allow_parallel ?? false,
                });
            } catch (e) {
                unlisten();
                throw e;
            }
            return unlisten;
        });
    }
}

export type {InjectionResult};
export default Injection;