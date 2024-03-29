

type UnserializableValueTag = "undefined" | "null" | "NaN" | "Infinity" | "-Infinity";

type Unserializable = {
    value: UnserializableValueTag;
    unserializable: true;
};

type Ok<T> = { value: T; };

type Err = { error: string; };

export type InjectionResult<T> = Ok<T> | Err;
export type RawInjectionResult<T> = Unserializable | InjectionResult<T>;

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

export const process_raw_injection_result = <T>(result: RawInjectionResult<T>): InjectionResult<T> => {
    if ("unserializable" in result) return resolve_unserializable_type(result);
    return result;
}