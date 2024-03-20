window.__INJECTOR__ = (initiator_label, injection_id, fn, args) => {

    const emit = (result) =>
        window.__TAURI__.window.WebviewWindow
            .getByLabel(initiator_label)
            .emit(injection_id, result);

    const state_check = setInterval(() => {
        if (document.readyState !== 'complete') return;
        clearInterval(state_check);

        const unserializable_types = [undefined, null, NaN, Infinity, -Infinity];
        const unserializable_types_str = ["undefined", "null", "NaN", "Infinity", "-Infinity"];

        try {
            const result = fn(...args);

            if (unserializable_types.includes(result)) {
                const type_index = unserializable_types.indexOf(result);
                emit({ok: unserializable_types_str[type_index], special: true});
                return;
            }

            emit({ok: result});
        } catch (e) {
            emit({err: e.toString()});
        }
    }, 100);
}

window.document.addEventListener('DOMContentLoaded', () => {
    window.__TAURI__.event.emit('navigation', {url: window.location.href});
});