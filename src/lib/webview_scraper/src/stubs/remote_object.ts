const REMOTE_OBJECT_RESOLVER = Symbol('remote_object_resolver');

type Proxiable = HTMLElement;
type RemoteObjectResolver<T> = () => T;
type RemoteObjectProxy<T> = { readonly [REMOTE_OBJECT_RESOLVER]: RemoteObjectResolver<T> }

type ErrorBrand<Err extends string> = Readonly<{ [key in Err]: void; }>;

type Zip<T extends readonly [...any], U extends readonly [...any]> =
    T extends [infer THead, ...infer TTail] ?
        U extends [infer UHead, ...infer UTail] ?
            [[THead, UHead], ...Zip<TTail, UTail>]
            : []
        : [];

type Equivalent<T, U> = [T, U] extends [U, T] ? true : false;
type Constructor<T = any> = new (...args: any[]) => T;

type ValidatePair<Arg, Param> = [
    Arg extends RemoteObjectProxy<infer T> ?
        Equivalent<Param, T> extends false ?
            ErrorBrand<"Resolved type of the argument doesn't match the parameter">
            : Arg
        : Arg extends Proxiable ?
            ErrorBrand<"Argument is a proxiable type, it should be wrapped in a RemoteObjectProxy">
            : Equivalent<Arg, Param> extends false ?
                ErrorBrand<"Argument type doesn't match parameter type">
                : Arg,

    Param extends Proxiable ?
        Arg extends RemoteObjectProxy<infer T> ?
            Equivalent<Param, T> extends false ?
                ErrorBrand<"Type of the parameter doesn't match the resolved type of the argument">
                : Param
            : ErrorBrand<"Parameter is a proxiable type, its corresponding argument should be a RemoteObjectProxy resolving to the same type">
        : Param extends RemoteObjectProxy<any> ?
            ErrorBrand<"Parameter is a RemoteObjectProxy type, replace it with its resolved type">
            : Arg extends Constructor ?
                Equivalent<InstanceType<Arg>, Param> extends false ?
                    ErrorBrand<"Parameter doesn't match the type of the resolved argument">
                    : Param
                : Equivalent<Arg, Param> extends false ?
                    ErrorBrand<"Parameter type doesn't match argument type">
                    : Param

];

type ValidatePairwise<T extends [any, any][]> =
    T extends [[infer Arg, infer Param], ...infer Rest] ?
        Rest extends [any, any][] ?
            [ValidatePair<Arg, Param> extends infer ValidatedPair ?
                ValidatedPair extends [any, any] ?
                    ValidatedPair
                    : never
                : never
                , ...ValidatePairwise<Rest>]
            : never
        : [];

type ExtractValidated<P extends [any, any][], ExtractedType extends "Args" | "Params"> =
    P extends [[infer Arg, infer Param], ...infer Rest] ?
        Rest extends [any, any][] ?
            [
                ExtractedType extends "Args" ? Arg : Param,
                ...ExtractValidated<Rest, ExtractedType>
            ]
            : never
        : [];

type TupleLength<T extends readonly [...any], Acc extends any[] = []> =
    T extends [infer _, ...infer Rest] ?
        TupleLength<Rest, [any, ...Acc]>
        : Acc["length"];

type Validate<Args extends readonly [...any], Params extends readonly [...any], ValidateType extends "Args" | "Params"> =
    Args['length'] extends Params['length'] ?
        ValidatePairwise<Zip<Args, Params>> extends infer ValidatedPairs ?
            ValidatedPairs extends [any, any][] ?
                ExtractValidated<ValidatedPairs, ValidateType>
                : never
            : never
        : [ErrorBrand<`Parameter count (${TupleLength<Params>}) doesn't match arguments count (${TupleLength<Args>})`>];

type InjectedFunction<Params extends readonly [...any], Args extends readonly [...any]> =
    ((...params: Params) => any) extends ((...params: Validate<Args, Params, "Params">) => any) ?
        (...params: Params) => any
        : (...params: Validate<Args, Params, "Params">) => any;

type InjectedArgs<Args extends readonly [...any], Params extends readonly [...any]> =
    Args extends Validate<Args, Params, "Args"> ? Args : Validate<Args, Params, "Args">;

const hasRemoteObjectResolver = <T>(obj: any): obj is RemoteObjectProxy<T> => {
    return obj[REMOTE_OBJECT_RESOLVER] !== undefined;
};

function getRemoteObjectResolver<T = any>(obj: any): RemoteObjectResolver<T> {
    if (!hasRemoteObjectResolver<T>(obj)) throw new Error('Object is not a remote object proxy');
    return obj[REMOTE_OBJECT_RESOLVER]
}

const makeRemoteObjectProxy =
    <T extends Proxiable>(resolver: RemoteObjectResolver<T>, typeName: string): T & RemoteObjectProxy<T> => {
        return new Proxy({[REMOTE_OBJECT_RESOLVER]: resolver} as T & RemoteObjectProxy<T>, {
            get(target, prop) {
                if (prop === REMOTE_OBJECT_RESOLVER) return Reflect.get(target, prop);
                throw new Error(
                    `Cannot access property ${String(prop)} of remote object ${typeName} outside of injection context`
                );
            },
            set(_, prop) {
                throw new Error(
                    `Cannot set property ${String(prop)} of remote object ${typeName} outside of injection context`
                );
            },
            apply() {
                throw new Error(
                    `Cannot call remote object ${typeName} outside of injection context`
                );
            }
        });
    };

export type {
    RemoteObjectProxy,
    RemoteObjectResolver,
    InjectedArgs,
    InjectedFunction
};
export {
    REMOTE_OBJECT_RESOLVER,
    hasRemoteObjectResolver,
    getRemoteObjectResolver,
    makeRemoteObjectProxy
};
