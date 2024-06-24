import {describe, expect, it} from "vitest";

const makeBoundFunctionStub =
    <Fn extends (...args: any[]) => any>(fn: Fn): Fn => {
        fn.toString = ((f: string, ...args: any[]) =>
                `(${f}).bind(null, ${args.map(a => JSON.stringify(a)).join(", ")})`
        ).bind(null, fn.toString());

        const bindable = <T extends Function>(fn: T) => {
            fn.bind = new Proxy(fn.bind, {
                apply(target: any, thisArg: any, argArray: any[]): any {
                    const bound = Reflect.apply(target, thisArg, argArray) as Function;
                    bound.toString = thisArg.toString.bind(null, ...argArray.slice(1));
                    return bindable(bound);
                }
            });
            return fn;
        }

        return bindable(fn);
    }

export default makeBoundFunctionStub;

if (import.meta.vitest) {
    describe('makeBoundFunction', () => {
        it('should throw when called', () => {
            const fn = makeBoundFunctionStub((a: number, b: string) => a + b);
            expect(() => fn(1, "2")).toThrowError("Bound function stub cannot be called outside injection context");
        });

        it('should serialize to function with a bind call', () => {
            const fn = makeBoundFunctionStub((a: number, b: string) => a + b).bind(null, 1);
            expect(fn.toString()).toBe("((a, b) => a + b).bind(null, 1)");
        });

        it('should serialize to function with a bind call multiple times', () => {
            const fn = makeBoundFunctionStub((a: number, b: string) => a + b)
                .bind(null, 1)
                .bind(null, "2");
            expect(fn.toString()).toBe("((a, b) => a + b).bind(null, 1, 2)");
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