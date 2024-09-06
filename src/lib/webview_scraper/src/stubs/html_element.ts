import {
    getRemoteObjectResolver,
    hasRemoteObjectResolver,
    makeRemoteObjectProxy,
    RemoteObjectProxy
} from "./remote_object.ts";
import makeIIFEStub from "./iife.ts";
import "../injection_handler.d.ts";

type HTMLElementProxy<T extends HTMLElement> = T & RemoteObjectProxy<T>;

const makeHTMLElementProxy = <T extends HTMLElement>(
    remote_id: string
): HTMLElementProxy<T> => {
    return makeRemoteObjectProxy(
        makeIIFEStub((id: string) => __INJECTOR_ELEMENT_TRACKER__.get_element(id), remote_id),
        "HTMLElement"
    );
}

export type {HTMLElementProxy};
export {makeHTMLElementProxy};
export default makeHTMLElementProxy;

if (import.meta.vitest) {
    const { it, expect, describe } = import.meta.vitest

    describe('makeHTMLElementProxy', () => {
        it('should create an html element proxy', () => {
            const stub = makeHTMLElementProxy<HTMLDivElement>("remote-id");
            expect(hasRemoteObjectResolver(stub)).toBe(true);
            expect(getRemoteObjectResolver(stub)).toBeInstanceOf(Function);
        });

        it('should throw when setting a property', () => {
            const stub = makeHTMLElementProxy("remote-id");
            expect(() => (stub as any).prop = "new value")
                .toThrowError("Cannot set property prop of remote object HTMLElement outside of injection context");
        });

        it('should throw when getting a property', () => {
            const stub = makeHTMLElementProxy("remote-id");
            expect(() => (stub as any).prop)
                .toThrowError("Cannot access property prop of remote object HTMLElement outside of injection context");
        });

        it('should throw when calling', () => {
            const stub = makeHTMLElementProxy("remote-id");
            expect(() => (stub as any)())
                .toThrowError("Cannot call remote object HTMLElement outside of injection context");
        });
    });
}