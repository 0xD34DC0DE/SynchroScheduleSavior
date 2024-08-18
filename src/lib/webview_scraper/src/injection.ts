import {WebviewWindow} from "@tauri-apps/api/window";
import {UnlistenFn} from "@tauri-apps/api/event";
import {InjectedArgs, InjectedFunction} from "./stubs/remote_object.ts";
import {webview_inject} from "./commands.ts";
import {uniqueEventId} from "./utils.ts";
import toEJSON from "./ejson.ts";

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

type InjectionResultCallbackFor<Fn extends (...args: any[]) => ReturnType<Fn>> =
    (result: InjectionResult<ReturnType<Fn>>) => void;

type OnInjectionResultCallback<Params extends readonly [...any], Args extends readonly [...any]> =
    InjectionResultCallbackFor<InjectedFunction<Params, Args>>;

type RawInjectionResultFor<Params extends readonly [...any], Args extends readonly [...any]> =
    RawInjectionResult<ReturnType<InjectedFunction<Params, Args>>>;

class Injection<Args extends readonly [...any], Params extends readonly [...any]> {
    private readonly _injection_id: number;
    private readonly js_function: InjectedFunction<Params, Args>;
    private readonly args: [...any];

    private readonly options?: {
        allow_parallel?: boolean;
    };

    constructor(
        js_function: InjectedFunction<Params, Args>,
        args: InjectedArgs<Args, Params>,
        options?: {
            allow_parallel?: boolean;
        }
    ) {
        this.options = options;
        this.args = args;
        this.js_function = js_function;
        this._injection_id = uniqueEventId();
    }

    public async inject(
        target: WebviewWindow,
        on_result?: OnInjectionResultCallback<Params, Args>
    ): Promise<UnlistenFn> {
        return target.once<RawInjectionResultFor<Params, Args>>(
            this._injection_id.toString(),
            (event) => on_result?.(process_raw_injection_result(event.payload))
        ).then(async unlisten => {
            try {
                await webview_inject(target.label, {
                    injection_id: this._injection_id,
                    js_function: toEJSON(this.js_function),
                    function_args: toEJSON(this.args),
                    allow_parallel: this.options?.allow_parallel ?? false,
                });
            } catch (e) {
                unlisten();
                throw e;
            }
            return unlisten;
        });
    }
}

export type {InjectionResult, InjectionResultCallbackFor};
export default Injection;