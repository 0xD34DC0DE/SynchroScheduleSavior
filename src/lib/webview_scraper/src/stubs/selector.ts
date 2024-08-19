import {HTMLElementProxy} from "./html_element.ts";
import {getRemoteObjectResolver, hasRemoteObjectResolver, REMOTE_OBJECT_RESOLVER,} from "./remote_object.ts";
import makeIIFEStub from "./iife.ts";

class Selector<T extends HTMLElement> {
    constructor(public readonly selector: SelectorType<T>) {
    }

    get [REMOTE_OBJECT_RESOLVER](): () => T {
        if (typeof this.selector === "string") {
            return makeIIFEStub((sel: string) => {
                const element = document.querySelector(sel);
                if (!element) throw new Error(`Element with selector ${sel} not found`);
                if (!(element instanceof HTMLElement)) throw new Error(`Element is not an HTMLElement: ${element}`);
                return element as T;
            }, this.selector);
        }

        if (hasRemoteObjectResolver(this.selector)) {
            return getRemoteObjectResolver(this.selector);
        }

        if ("element" in this.selector && "selector" in this.selector) {
            return makeIIFEStub((sel: string, element: HTMLElement) => {
                const child = element.querySelector(sel);
                if (!child) throw new Error(`Element with selector ${sel} not found`);
                if (!(child instanceof HTMLElement)) throw new Error(`Element is not an HTMLElement: ${child}`);
                return child as T;
            }, this.selector.selector, this.selector.element)
        }

        throw new Error("Invalid selector");
    }
}

type SelectorType<T extends HTMLElement> =
    string | HTMLElementProxy<T> | {selector: string; element: HTMLElementProxy<HTMLElement>};

export type {SelectorType};
export {Selector};