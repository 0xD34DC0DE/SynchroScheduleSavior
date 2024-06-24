import {HTMLElementStub} from "./html_element.ts";
import makeBoundFunctionStub from "./bound_function.ts";
import {ResolvableClass} from "./resolvable.ts";

class Selector<T extends HTMLElement> implements ResolvableClass<Selector<T>> {
    constructor(public readonly selector: string | HTMLElementStub<T>) {
    }

    resolve(): () => T {
        if (typeof this.selector === "string") {
            return makeBoundFunctionStub((sel: string) => {
                const element = document.querySelector(sel);
                if (!element) throw new Error(`Element with selector ${sel} not found`);
                if (!(element instanceof HTMLElement)) throw new Error(`Element is not an HTMLElement: ${element}`);
                return element as T;
            }).bind(null, this.selector);
        }

        if (this.selector._remote_id_) {
            return makeBoundFunctionStub((id: string) => {
                const element = window.__INJECTOR_STATE__[id];
                if (!element) throw new Error(`Element with id ${id} not found`);
                if (!(element instanceof HTMLElement)) throw new Error(`Element is not an HTMLElement: ${element}`);
                return element as T;
            }).bind(null, this.selector._remote_id_);
        }

        throw new Error("Invalid selector");
    }
}

export type {Selector};

declare const window: {
    __INJECTOR_STATE__: Record<string, HTMLElement>;
};