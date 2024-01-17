window.__INJECTOR__ = (event_name, fn, args) => {
    let unlisten_cancel;

    new Promise((resolve, reject) => {
        unlisten_cancel = window.__TAURI__.once("cancel-" + event_name, () => resolve({cancelled: true}));

        let state_check = setInterval(() => {
            if (document.readyState === 'complete') {
                clearInterval(state_check);

                const unserializable_types = [undefined, null, NaN, Infinity, -Infinity];
                const unserializable_types_str = ["undefined", "null", "NaN", "Infinity", "-Infinity"];

                try {
                    const result = fn(...args);

                    if (unserializable_types.includes(result)) {
                        const type_index = unserializable_types.indexOf(result);
                        resolve({ok: unserializable_types_str[type_index], special: true});
                    }

                    resolve({ok: result});
                } catch (e) {
                    resolve({err: e.toString()});
                }
            }
        }, 100);
    })
        .then(result => {
            window.__TAURI__.event.emit(event_name, result);
            unlisten_cancel();
        })
        .catch(err => {
            window.__TAURI__.event.emit(event_name, {err: err.toString()});
            unlisten_cancel();
        });
}
