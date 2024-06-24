
type Resolved<T> = T extends { resolve: (self: T) => infer U }
    ? U extends Resolvable<U>
        ? Resolved<U>
        : Function
    : never;

type Resolver<T> =
    (this: T) => T extends (self: Resolvable<T>) => Resolvable<infer U>
        ? U
        : Function;

type Resolvable<T> =
    T extends { resolve: Resolver<T> }
        ? T
        : never;

type ResolvedType<T> =
    T extends any[]
        ? ResolvedArray<T>
        : ResolvedObject<T>;

type ResolvedArray<T extends any[]> =
    T extends [infer Arg, ...infer Rest]
        ? [Resolved<Arg>, ...ResolvedType<Rest>]
        : never;

type ResolvedObject<T> = {
    [K in keyof T]: ResolvedType<T[K]>;
};

interface ResolvableClass<T> {
    resolve: Resolver<T>;
}

const toResolvable = <T, U>(value: T, resolver: Resolver<U>): Resolvable<T> =>
    Object.defineProperties(value, {
        resolve: {
            value: resolver,
            writable: false,
            enumerable: false,
            configurable: false
        }
    }) as Resolvable<T>;

const isResolvable = <T extends Object | Function>(value: T): value is Resolvable<T> => {
    return "resolve" in value && Object.hasOwn(value, "resolve") && typeof value.resolve === "function";
}

const resolve = <T>(value: Function | Object): Resolved<T> | Object => {
    let resolved: any = value;
    while (isResolvable(resolved)) {
        resolved = resolved.resolve(resolved);
    }
    if (typeof value !== "function") throw new Error("Value is not a function");
    return resolved;
}

export type {ResolvedType, Resolved, Resolvable, ResolvableClass};
export {toResolvable, resolve};