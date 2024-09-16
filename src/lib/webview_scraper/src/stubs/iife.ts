import {
    getRemoteObjectResolver,
    hasRemoteObjectResolver,
    InjectedArgs,
    InjectedFunction,
    makeRemoteObjectProxy
} from "./remote_object.ts";

const serializeArg = (arg: any) => {
    if (typeof arg === "function") return arg.toString();
    if (hasRemoteObjectResolver(arg)) return getRemoteObjectResolver(arg).toString();
    return JSON.stringify(arg);
}

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
const makeIIFEStub = <Params extends [...any], Args extends [...any]>(
    fn: InjectedFunction<Params, Args>,
    ...args: InjectedArgs<Args, Params>
): () => ReturnType<InjectedFunction<Params, Args>> => {
    fn.toString = ((f: string, ...args: any[]) =>
            `(${f})(${args.map(serializeArg).join(", ")})`.replace("\\\"", "\"")
    ).bind(null, fn.toString(), ...args);

    return new Proxy(fn, {
        apply(): never {
            throw new Error("IIFE cannot be called outside injection context");
        }
    }) as () => ReturnType<InjectedFunction<Params, Args>>;
}

export default makeIIFEStub;

if (import.meta.vitest) {
    const {it, expect, describe} = import.meta.vitest

    describe('makeIIFE', () => {
        it('should serialize to an IIFE', () => {
            const fn = makeIIFEStub((a: number, b: string) => a + b, 1, "2");
            expect(fn.toString()).toBe('((a, b) => a + b)(1, "2")');
        });

        it('should throw when called', () => {
            const fn = makeIIFEStub((a: number, b: string) => a + b, 1, "2");
            expect(() => fn()).toThrowError("IIFE cannot be called outside injection context");
        });

        it('should serialize function arguments to their string representation', () => {
            const fn = makeIIFEStub((a: (b: number) => number) => a(1), (a: number) => a);
            expect(fn.toString()).toBe("((a) => a(1))((a) => a)");
        });

        it('should serialize remote object arguments to their resolver', () => {
            const proxy = makeRemoteObjectProxy(() => ({} as HTMLDivElement), "HTMLDivElement");
            const fn = makeIIFEStub((a: HTMLDivElement) => a, proxy);
            expect(fn.toString()).toBe(`((a) => a)(${getRemoteObjectResolver(proxy)})`);
        });
    });
}