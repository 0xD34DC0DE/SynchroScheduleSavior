import {HTMLElementProxy} from "./html_element.ts";
import {getRemoteObjectResolver, hasRemoteObjectResolver, REMOTE_OBJECT_RESOLVER,} from "./remote_object.ts";
import makeIIFEStub from "./iife.ts";

class Selector<T extends HTMLElement> {
    constructor(public readonly selector: string | HTMLElementProxy<T>) {
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

        throw new Error("Invalid selector");
    }
}

export {Selector};