window.__INJECTOR__ = (initiator_label, injection_id, fn, args, context_builder) => {
    
    const context = context_builder(initiator_label);

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
            const result = context ? fn(context, ...args) : fn(...args);

            if (unserializable_types.includes(result)) {
                const type_index = unserializable_types.indexOf(result);
                emit({value: unserializable_types_str[type_index], special: true});
                return;
            }

            emit({value: result});
        } catch (e) {
            emit({error: e.toString()});
        }
    }, 100);
}

window.document.addEventListener('DOMContentLoaded', () => {
    window.__TAURI__.event.emit('navigation', {url: window.location.href});
});