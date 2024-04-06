import {WebviewWindow} from "@tauri-apps/api/window";
import {UnlistenFn} from "@tauri-apps/api/event";
import {webview_inject} from "./commands.ts";
import {Context} from "./context.ts";


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

export type ParametersWithoutContext<F> = F extends (ctx: Context, ...args: infer P) => any ? P : never;

export type TaskWithContextFn<
    Ctx extends Context,
    F extends (...args: any) => any
> = F extends ((ctx: Ctx, ...args: ParametersWithoutContext<F>) => ReturnType<F>) ? F : never;

export class Injection<Ctx extends Context, F extends (...args: any[]) => any> {
    private readonly _injection_id: number;

    constructor(
        js_function: F,
        args: Parameters<F>,
        options?: {
            allow_parallel?: boolean
        }
    );
    constructor(
        js_function: TaskWithContextFn<Ctx, F>,
        args: ParametersWithoutContext<F>,
        options: {
            context_prototypes: Function[];
            allow_parallel?: boolean;
        }
    );
    constructor(
        private readonly js_function: F | TaskWithContextFn<Ctx, F>,
        private readonly args: Parameters<F> | ParametersWithoutContext<F>,
        private readonly options?: {
            context_prototypes?: Function[];
            allow_parallel?: boolean;
        }
    ) {
        this._injection_id = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
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
                await webview_inject(target.label,
                    this._injection_id,
                    this.js_function.toString(),
                    this.args,
                    this.options?.allow_parallel ?? false,
                    this.options?.context_prototypes);
            } catch (e) {
                unlisten();
                throw e;
            }
            return unlisten;
        });
    }
}
