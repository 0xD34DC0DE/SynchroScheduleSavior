import {HTMLElementProxy} from "./html_element.ts";
import {getRemoteObjectResolver, hasRemoteObjectResolver, REMOTE_OBJECT_RESOLVER,} from "./remote_object.ts";
import makeIIFEStub from "./iife.ts";

class Selector<T extends HTMLElement> {
    constructor(public readonly selector: SelectorType<T>) {
    }

    get [REMOTE_OBJECT_RESOLVER](): () => T {
        if (typeof this.selector === "string") {
            return makeIIFEStub((sel: string) => {
                const element = document.querySelector(atob(sel));
                if (!element) throw new Error(`Element with selector ${atob(sel)} not found`);
                if (!(element instanceof HTMLElement)) throw new Error(`Element is not an HTMLElement: ${element}`);
                return element as T;
            }, this._escapeSelector(this.selector));
        }

        if (hasRemoteObjectResolver(this.selector)) {
            return getRemoteObjectResolver(this.selector);
        }

        if ("element" in this.selector && "selector" in this.selector) {
            return makeIIFEStub((sel: string, element: HTMLElement) => {
                const child = element.querySelector(atob(sel));
                if (!child) throw new Error(`Element with selector ${atob(sel)} not found`);
                if (!(child instanceof HTMLElement)) throw new Error(`Element is not an HTMLElement: ${child}`);
                return child as T;
            }, this._escapeSelector(this.selector.selector), this.selector.element)
        }

        throw new Error("Invalid selector");
    }

    private _escapeSelector(selector: string): string {
        //encode in base64 to avoid issues with special characters
        return btoa(selector.replace(/(?<!\\)\$/g, "\\$"));
    }
}

type SelectorType<T extends HTMLElement> =
    string | HTMLElementProxy<T> | {selector: string; element: HTMLElementProxy<HTMLElement>};

export type {SelectorType};
export {Selector};