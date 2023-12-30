window.__INJECTOR__ = (event_name, fn, expected_type, args) => {
    const ok = (val) => window.__TAURI__.event.emit(event_name, {ok: val});
    const ok_special = (val) => window.__TAURI__.event.emit(event_name, {ok: val, special: true});
    const err = (val) => window.__TAURI__.event.emit(event_name, {err: val});

    try {
        const result = fn(...args);

        if (typeof result !== expected_type) {
            err(`Returned value does not match expected type, expected ${expected_type}, got ${typeof result}`);
        } else if (result === undefined) {
            ok_special("undefined");
        } else if (result === null) {
            ok_special("null");
        } else if (Number.isNaN(result)) {
            ok_special("NaN");
        } else if (result === Infinity) {
            ok_special("Infinity");
        } else if (result === -Infinity) {
            ok_special("-Infinity");
        } else {
            ok(result);
        }

        err("Function returned an value of an unsupported type");
    } catch (e) {
        err(e.toString());
    }
}