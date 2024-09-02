class NodePathIterator {
    constructor(node) {
        this.node = node;
    }

    * [Symbol.iterator]() {
        yield* NodePathIterator.#get_node_path(this.node);
    }

    /**
     * Returns the path of a given HTML element node.
     *
     * @param {HTMLElement} node - The HTML element node.
     * @returns {Generator<string>} - The path segments of the node.
     */
    static* #get_node_path(node) {
        const [done, segment] = NodePathIterator.#get_node_path_segment(node);
        if (done) return segment; else yield segment;
        yield* NodePathIterator.#get_node_path(node.parentElement);
    }

    /**
     * Returns the path segment of a given HTML element node.
     * @param {HTMLElement} node - The HTML element node.
     * @returns {[boolean, string]}
     * A tuple containing a boolean indicating if the path is complete and the path segment.
     */
    static #get_node_path_segment(node) {
        if (!(node instanceof HTMLElement)) return [true, ""];
        if (node === document.body) return [true, "body"];
        if (node.id) return [true, `#${node.id}`];

        let index = 0;
        let sibling = node.previousElementSibling;
        while (sibling) {
            if (sibling.nodeName === node.nodeName) index++;
            sibling = sibling.previousElementSibling;
        }

        const node_name = node.nodeName.toLowerCase();
        return [false, `${node_name}:nth-of-type(${index + 1})`];
    }
}

/** Represents a location of an HTML element node. */
class ElementLocation {
    /**
     * @param {HTMLElement} node - The HTML element node.
     * @param {boolean} lazy - If true, the path segments are lazily computed.
     * */
    constructor(node, lazy = true) {
        /** @type {NodePathIterator} */
        this.path_segments = lazy ? new NodePathIterator(node) : [...new NodePathIterator(node)];
    }
}

/** Represents a tracked html element. */
class TrackedElement {

    /** @param {HTMLElement} element - The element to be tracked. */
    constructor(element) {
        if (!(element instanceof HTMLElement)) throw new Error("Only HTML elements can be tracked.");
        this.id = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString();
        this.element = element;
        this.location = new ElementLocation(element, false);
        this.dangling = false;
    }

    /**
     * Compares the location of the tracked element with another element.
     *
     * @param {HTMLElement} element - The element to compare the location with.
     * @returns {boolean} - True if the elements have the same location, false otherwise.
     */
    compare_element(element) {
        if (!(element instanceof HTMLElement)) return false;
        if (element === this.element) return true;
        if (element.tagName !== this.element.tagName) return false;
        if (element.id !== this.element.id) return false;

        const element_location = new ElementLocation(element);
        let index = 0;
        for (const segment of element_location.path_segments) {
            if (segment !== this.location.path_segments[index]) return false;
            index++;
        }
        return true;
    }
}

/** Represents a class for tracking HTML element nodes. */
class ElementTracker {
    constructor() {
        /** @type {Object<string, TrackedElement>} */
        this.tracked_elements = {};
        /** @type {Array<[string, TrackedElement]>} */
        this.dangling_elements_cache = [];
        /** @type {Array<[string, TrackedElement]>} */
        this.active_elements_cache = [];
        /** @type {MutationObserver} */
        this.observer = new MutationObserver(this.#update.bind(this));

        if (document.readyState === 'complete') {
            /** @type {HTMLElement} (To silence the linter) */
            const body = document.body;
            this.observer.observe(body, {childList: true, subtree: true});
        } else {
            window.addEventListener('DOMContentLoaded', () => {
                /** @type {HTMLElement} (To silence the linter) */
                const body = document.body;
                this.observer.observe(body, {childList: true, subtree: true});
            });
        }
    }


    /**
     * Starts tracking the specified HTML element.
     *
     * @param {HTMLElement} element - The HTML element to be tracked.
     * @returns {string} - The ID of the tracked element.
     * @throws {Error} - If the element is not an instance of HTMLElement.
     */
    // noinspection JSUnusedGlobalSymbols
    track_element(element) {
        const tracked_element = new TrackedElement(element);
        this.tracked_elements[tracked_element.id] = tracked_element;
        this.active_elements_cache.push([tracked_element.id, tracked_element]);
        return tracked_element.id;
    }

    /**
     * Retrieves the tracked element with the specified id.
     *
     * @param {string} id - The id of the tracked element.
     * @returns {HTMLElement} - The tracked element node.
     * @throws {Error} - If no tracked element is found with the specified id or if the tracked element does not exist in the DOM.
     */
    // noinspection JSUnusedGlobalSymbols
    get_element(id) {
        const tracked_element = this.tracked_elements[id];
        if (!tracked_element) throw new Error(`No tracked element found with id: ${id}`);
        if (tracked_element.dangling) throw new Error(`Tracked element with id: ${id} does not exist in the DOM.`);
        return tracked_element.element;
    }

    #update(mutations) {
        mutations
            .filter(mutation => mutation.type === 'childList')
            .forEach((mutation) => {
                this.#handle_removed_nodes(mutation.removedNodes);
                this.#handle_added_nodes(mutation.addedNodes);
            });
    }

    /**
     * Handles removed nodes.
     *
     * @param {NodeList} removed_nodes - The list of removed nodes.
     */
    #handle_removed_nodes(removed_nodes) {
        Array.from(removed_nodes)
            .filter(node => node instanceof HTMLElement)
            .flatMap(element =>
                this.active_elements_cache
                    .filter(
                        ([_, active_element]) => element.contains(active_element.element)
                    )
                    .map(([id, _]) => id)
            )
            .forEach(this.#mark_element_as_dangling.bind(this));
    };

    #mark_element_as_dangling(id) {
        this.tracked_elements[id].dangling = true;
        this.dangling_elements_cache.push([id, this.tracked_elements[id]]);
        this.active_elements_cache = this.active_elements_cache.filter(
            ([active_id, _]) => active_id !== id
        );
    }

    /**
     * Handles added nodes.
     *
     * @param {NodeList} added_nodes - The list of added nodes.
     * @returns {Array<[string, HTMLElement]>} - The list of added elements.
     * @throws {Error} - If the element is not an instance of HTMLElement.
     */
    #handle_added_nodes(added_nodes) {
        Array.from(added_nodes)
            .filter(node => node instanceof HTMLElement)
            .flatMap(element => {
                const traverse = (element) => {
                    const reactivated_elements = {};
                    for (const [id, dangling_element] of this.dangling_elements_cache) {
                        if (dangling_element.compare_element(element)) {
                            reactivated_elements[id] = element;
                        }
                    }
                    Object.entries(reactivated_elements).forEach(([id, element]) => {
                        this.#reactivate_element(id, element);
                    });

                    if (this.dangling_elements_cache.length === 0) return;
                    Array.from(element.children).forEach(traverse);
                };
                traverse(element);
            });
    }

    #reactivate_element(id, element) {
        this.tracked_elements[id].element = element;
        this.tracked_elements[id].dangling = false;
        this.active_elements_cache.push([id, this.tracked_elements[id]]);
        this.dangling_elements_cache = this.dangling_elements_cache.filter(
            ([dangling_id, _]) => dangling_id !== id
        );
    }

}

// noinspection JSUnusedGlobalSymbols
const __INJECTOR_ELEMENT_TRACKER__ = new ElementTracker();

// noinspection JSUnusedGlobalSymbols
const __INJECTOR__ = (injector_args) => {
    const {initiator_label, injection_id, fn, args} = injector_args;

    const emit = (result) => {
        if ("error" in result) console.error(result.error);
        __TAURI__.window.WebviewWindow
            .getByLabel(initiator_label)
            .emit(injection_id, result);
    }

    const unserializable_types = [undefined, null, NaN, Infinity, -Infinity];
    const unserializable_types_str = ["undefined", "null", "NaN", "Infinity", "-Infinity"];
    const emit_result = (result) => {
        if (typeof result == "object" && "error" in result) console.error(result.error.bind(result));
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
            const result = fn(...args());
            if (result instanceof Promise) {
                result.then(emit_result).catch((e) => emit({error: e.toString()}));
            } else {
                emit_result(result);
            }
        } catch (e) {
            emit({error: e.toString()});
        }
    }, 100);
};

window.document.addEventListener('DOMContentLoaded', () => {
    __TAURI__.event.emit('navigation', {url: window.location.href});
});

window.addEventListener('error', (event) => {
    console.log('window error', event);
});