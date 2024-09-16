import {OnSerialize} from "@pvermeer/dexie-class-addon";

type Primitive = string | number | boolean | null | undefined;
type Serializable = Primitive | { [key: string]: Serializable } | Serializable[];

type OmitMethods<T> = {
    [K in keyof T as T[K] extends Function ? never : (K extends string ? K : never)]: T[K];
};

interface IndexableEntity<KeyProp extends string> extends OnSerialize {
    serialize(): { [key in KeyProp]: () => Serializable } & Record<string, () => Serializable>;
}

interface Entity extends OnSerialize {
    serialize(): Record<string, () => Serializable>;
}

const serializeEntity = <T extends Entity>(entity: T): Record<string, Serializable> => {
    const serialized = entity.serialize();
    const result = {} as Record<string, Serializable>;
    for (const [key, value] of Object.entries(serialized)) {
        result[key] = value();
    }
    return result;
}

export type {IndexableEntity, Entity, OmitMethods, Serializable};
export {serializeEntity};