import {HTMLElementStub} from "./html_element.ts";
import makeBoundFunctionStub from "./bound_function.ts";
import InjectableStub from "./types.ts";

/**
 * Represents a selector for an HTMLElement.
 */
type Selector<T extends HTMLElement> = string | HTMLElementStub<T>;

/**
 * Represents a resolver function for a selector.
 */
type Resolver<T extends Selector<any>> = InjectableStub<() => T>;

/**
 * Get the resolver function for a selector.
 * Resolvers are functions function stubs that can be evaluated from the injection context to resolve the specified
 * selector to an HTMLElement.
 * @param {Selector} selector The selector to resolve
 */
const getResolver = <T extends HTMLElement>(selector: Selector<T>): Resolver<T> => {
    if (typeof selector === "string") {
        return makeBoundFunctionStub((sel: string) => {
            const element = document.querySelector(sel);
            if (!element) throw new Error(`Element with selector ${sel} not found`);
            if (!(element instanceof HTMLElement)) throw new Error(`Element is not an HTMLElement: ${element}`);
            return element;
        }).bind(null, selector);
    }

    if ("_remote_id_" in selector) {
        return makeBoundFunctionStub((id: string) => {
            const element = window.__INJECTOR_STATE__[id];
            if (!element) throw new Error(`Element with id ${id} not found`);
            if (!(element instanceof HTMLElement)) throw new Error(`Element is not an HTMLElement: ${element}`);
            return element;
        }).bind(null, selector._remote_id_);
    }

    throw new Error(`Invalid selector: ${selector}`);
}

export {getResolver};
export type {Selector, Resolver};

declare const window: {
    __INJECTOR_STATE__: Record<string, HTMLElement>;
};