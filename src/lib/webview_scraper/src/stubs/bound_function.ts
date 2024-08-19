import {getRemoteObjectResolver, hasRemoteObjectResolver, makeRemoteObjectProxy} from "./remote_object.ts";

const serializeArg = (arg: any) => {
    if (typeof arg === "function") return arg.toString();
    if (hasRemoteObjectResolver(arg)) return getRemoteObjectResolver(arg).toString();
    return JSON.stringify(arg);
}

const makeBoundFunctionStub =
    <Params extends [...any], Args extends readonly [...any]>(
        fn: (...args: [...Args, ...Params]) => any,
        ...args: Args
    ): ((...args: Params) => any) => {
        fn.toString = ((f: string, ...args: any[]) =>
                `(${f}).bind(null, ${args.map(serializeArg).join(", ")})`
        ).bind(null, fn.toString());

        const bindable = <T extends Function>(fn: T) => {
            fn.bind = new Proxy(fn.bind, {
                apply(target: any, thisArg: any, argArray: any[]): any {
                    const bound = Reflect.apply(target, thisArg, argArray) as Function;
                    bound.toString = thisArg.toString.bind(null, ...argArray.slice(1));
                    return new Proxy(bindable(bound), {
                        apply(): any {
                            throw new Error("Bound function stub cannot be called outside injection context");
                        }
                    });
                }
            });
            return fn;
        }

        return bindable(fn).bind(null, ...args);
    }

export default makeBoundFunctionStub;

if (import.meta.vitest) {
    const { it, expect, describe } = import.meta.vitest
    describe('makeBoundFunction', () => {
        it('should throw when called', () => {
            const fn = makeBoundFunctionStub((a: number, b: string) => a + b);
            expect(() => fn(1, "2")).toThrowError("Bound function stub cannot be called outside injection context");
        });

        it('should serialize to function with a bind call', () => {
            const fn = makeBoundFunctionStub((a: number, b: string) => a + b).bind(null, 1);
            expect(fn.toString()).toBe("((a, b) => a + b).bind(null, 1)");
            const fn2 = makeBoundFunctionStub((a: number, b: string) => a + b, 1);
            expect(fn2.toString()).toBe("((a, b) => a + b).bind(null, 1)");
        });

        it('should serialize to function with a bind call multiple times', () => {
            const fn = makeBoundFunctionStub((a: number, b: string) => a + b)
                .bind(null, 1)
                .bind(null, "2");
            expect(fn.toString()).toBe("((a, b) => a + b).bind(null, 1, \"2\")");
        });

        it('should serialize function arguments to their string representation', () => {
            const fn = makeBoundFunctionStub((a: (b: number) => number ) => a(1)).bind(null, (a) => a);
            expect(fn.toString()).toBe("((a) => a(1)).bind(null, (a) => a)");
        });

        it('should serialize remote object arguments to their resolver', () => {
            const proxy = makeRemoteObjectProxy(() => ({} as HTMLDivElement), "HTMLDivElement");
            const fn = makeBoundFunctionStub((a: HTMLDivElement) => a, proxy);
            expect(fn.toString()).toBe(`((a) => a).bind(null, ${getRemoteObjectResolver(proxy)})`);
        });
        it('should serialize with different argument types', () => {
            const fn = makeBoundFunctionStub((_a: number, _b: string, _c: boolean, _d: object, _e: any) => 0)
                .bind(null, 1)
                .bind(null, "2")
                .bind(null, true)
                .bind(null, {"d": 1})
                .bind(null, [false, 1, "2"]);
            expect(fn.toString()).toBe('((_a, _b, _c, _d, _e) => 0).bind(null, 1, "2", true, {"d":1}, [false,1,"2"])');
        });
    });
}