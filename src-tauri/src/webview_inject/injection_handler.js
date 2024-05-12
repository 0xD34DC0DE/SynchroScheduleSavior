window.__INJECTOR_STATE__ = {};

window.__INJECTOR__ = (injector_args) => {

    const {initiator_label, injection_id, fn, args} = injector_args;

    // https://stackoverflow.com/a/70810697/8629453
    const isConstructor = (value) => {
        return typeof value === 'function' && !!value.prototype && value.prototype.constructor === value;
    }

    const emit = (result) =>
        window.__TAURI__.window.WebviewWindow
            .getByLabel(initiator_label)
            .emit(injection_id, result);

    const unserializable_types = [undefined, null, NaN, Infinity, -Infinity];
    const unserializable_types_str = ["undefined", "null", "NaN", "Infinity", "-Infinity"];
    const emit_result = (result) => {
        if (unserializable_types.includes(result)) {
            const type_index = unserializable_types.indexOf(result);
            emit({value: unserializable_types_str[type_index], special: true});
            return;
        }
        emit({value: result});
    };

    const state_check = setInterval(() => {
        if (document.readyState !== 'complete') return;
        clearInterval(state_check);

        try {
            const result = fn(...args);
            if (result instanceof Promise) {
                result.then(emit_result).catch((e) => emit({error: e.toString()}));
            } else {
                emit_result(result);
            }
        } catch (e) {
            emit({error: e.toString()});
        }
    }, 100);
}

window.document.addEventListener('DOMContentLoaded', () => {
    window.__TAURI__.event.emit('navigation', {url: window.location.href});
});