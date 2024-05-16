import {describe, expect, it} from "vitest";

type HTMLElementCtor<T extends HTMLElement> = new () => T & { _remote_id_?: string };

type HTMLElementStub<T extends HTMLElement> = HTMLElement & T & { _remote_id_?: string };

const makeHTMLElementStub = <T extends HTMLElement>(
    ctor: HTMLElementCtor<T>,
    remote_id: string
): HTMLElementStub<T> => {
    const mock_element = new ctor();
    mock_element._remote_id_ = remote_id;

    return new Proxy(mock_element, {
        get: function (target, prop, _receiver) {
            if (prop === "_remote_id_") return target._remote_id_;
            throw new Error(`Cannot get property ${String(prop)} of HTMLElementStub outside of injection context`);
        },
        set: function (_target, prop, _value, _receiver) {
            throw new Error(`Cannot set property ${String(prop)} of HTMLElementStub outside of injection context`);
        }
    });
}

export type {HTMLElementStub, HTMLElementCtor};
export default makeHTMLElementStub;

if (import.meta.vitest) {
    describe('makeHTMLElementStub', () => {
        class HTMLElement {

        }

        class MockElement extends HTMLElement {
            prop = "value";
        }

        it('should create a stub element with a remote id', () => {
            const stub = makeHTMLElementStub(MockElement as any, "remote-id");
            expect((stub as any)._remote_id_).toBe("remote-id");
        });

        it('should throw when setting the remote id', () => {
            const stub = makeHTMLElementStub(MockElement as any, "remote-id");
            expect(() => (stub as any)._remote_id_ = "new-id")
                .toThrowError("Cannot set property _remote_id_ of HTMLElementStub outside of injection context");
        });

        it('should throw when getting a property', () => {
            const stub = makeHTMLElementStub(MockElement as any, "remote-id");
            expect(() => (stub as any).prop)
                .toThrowError("Cannot get property prop of HTMLElementStub outside of injection context");
        });

        it('should throw when setting a property', () => {
            const stub = makeHTMLElementStub(MockElement as any, "remote-id");
            expect(() => (stub as any).prop = "new value")
                .toThrowError("Cannot set property prop of HTMLElementStub outside of injection context");
        });
    });
}