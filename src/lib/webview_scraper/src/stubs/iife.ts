import {describe, expect, it} from "vitest";

/**
 * Creates a stub for an immediately invoked function expression (IIFE).
 *
 * @example
 * const fn = makeIIFE((a: number, b: string) => a + b, 1, "2");
 * console.log(fn.toString()); // ((a, b) => a + b)(1, "2");
 *
 * @param fn The function to stub.
 * @param args The arguments to pass to the function when it is called
 * @returns A function that serializes to an IIFE with the given arguments.
 * @warning The returned function cannot be called. It will throw an error if called.
 */
const makeIIFEStub = <Fn extends (...args: any[]) => any>(fn: Fn, ...args: Parameters<Fn>): () => ReturnType<Fn> => {
    fn.toString = ((f: string, ...args: any[]) =>
        `(${f})(${args.map(a => JSON.stringify(a)).join(", ")})`
    ).bind(null, fn.toString(), ...args);

    fn = new Proxy(fn, {
        apply(): never {
            throw new Error("IIFE cannot be called outside injection context");
        }
    });

    return fn;
}

export default makeIIFEStub;

if (import.meta.vitest) {
    describe('makeIIFE', () => {
        it('should serialize to an IIFE', () => {
            const fn = makeIIFEStub((a: number, b: string) => a + b, 1, "2");
            expect(fn.toString()).toBe('((a, b) => a + b)(1, "2")');
        });

        it('should throw when called', () => {
            const fn = makeIIFEStub((a: number, b: string) => a + b, 1, "2");
            expect(() => fn()).toThrowError("IIFE cannot be called outside injection context");
        });
    });
}