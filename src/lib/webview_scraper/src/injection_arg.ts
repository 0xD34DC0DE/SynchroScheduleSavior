import {describe, expect, it} from "vitest";

type Constructor<T> = new (...args: any) => T;

/**
 * Serialize a class and all of its parent classes in a single string.
 * The parent classes are embedded in the "extends" clause of the child class
 * in a recursive manner. This way, the serialized class can be instantiated
 * directly in any environment without the need for the parent classes to
 * be defined in the same scope.
 *
 * Example:
 * class Leaf extends
 *    Intermediate extends
 *      Root {
 *      <root class body...>
 *      }
 *    {
 *      <intermediate class body...>
 *    }
 * {
 *  <leaf class body...>
 * }
 *
 * @param ctor The class constructor to serialize
 * @returns {string} The serialized class as a string with all parent classes
 */
const serialize_class = <T>(ctor: Constructor<T>): string => {
    const parent = Object.getPrototypeOf(ctor);
    if (parent.name === "") return ctor.toString(); // Not a subclass

    const ctorStr = ctor.toString();
    const parentName = parent.name;
    const parentOffset = ctorStr.indexOf(parentName);

    return ctorStr.substring(0, parentOffset) + "\n" +
        serialize_class(parent) +
        ctorStr.substring(parentOffset + parentName.length);
}

type Serializable = string | number | boolean | null | Serializable[] | { [key: string]: Serializable };

// Escaped objects are used to serialize objects that can't be normally serialized into JSON
// like functions or classes. The object is serialized as a single key-value pair where the key
// is a magic string and the value is the string representation of the object.
type Escaped = { "_!_": string };

// EJSON (Escaped JSON) is a type where certain value types that can't be normally serialized into JSON
// are replaced with a special object that can be serialized.
type EJSON = Serializable | Escaped;

// Serializable are the types that can be serialized into JSON without any special handling
// and the types that can be serialized with the Escaped object
type EJSONSerializable =
    Serializable |
    Constructor<any> |
    Function |
    EJSONSerializable[] |
    { [key: string]: EJSONSerializable };

// Based of https://stackoverflow.com/a/70810697/8629453
const isConstructor = (value: any): value is Constructor<any> => {
    return typeof value === 'function' && !!value.prototype && value.prototype.constructor === value;
}

// Serialize an object into EJSON
// This function works like structured clone algorithm in the browser, but it applies a transformation
// to objects that can't be serialized into JSON.
export const toEJSON = (obj: EJSONSerializable): EJSON => {
    if (Array.isArray(obj)) return obj.map(toEJSON);

    if (isConstructor(obj)) return {"_!_": serialize_class(obj)};

    if (typeof obj === "function") return {"_!_": obj.toString()};

    if (obj === null || typeof obj !== "object") return obj;

    const result: { [key: string]: EJSON } = {};
    for (const key in obj) {
        result[key] = toEJSON(obj[key]);
    }

    return result;
}


if (import.meta.vitest) {
    describe('toEJSON', () => {
        class Root {
            root() {
            }
        }

        class Intermediate extends Root {
            intermediate() {
            }
        }

        class LeafWithoutArgs extends Intermediate {
            constructor() {
                super();
            }

            leaf() {
            }
        }

        class LeafWithArgs extends Intermediate {
            constructor(a: number, b: string) {
                super();
                void a;
                void b;
            }

            leaf() {
            }
        }

        // Helper function to remove all whitespace and newlines from strings in an object
        // to make it easier to compare the strings while preserving a readable format
        // in the tests code.
        const withUnformattedStrings = (obj: any): any => {
            return JSON.parse(
                JSON.stringify(obj, (_, value) => {
                    if (typeof value !== "string") return value;
                    return value.replace(/\n|\s/g, "");
                })
            );
        }

        it('should serialize a leaf class that has a constructor with arguments with its parent classes',
            () => {
                expect(withUnformattedStrings(toEJSON(LeafWithArgs)))
                    .toMatchObject(withUnformattedStrings({
                        "_!_": `class LeafWithArgs extends
                                    class Intermediate extends
                                        class Root {
                                            root() {}
                                        }
                                    {
                                        intermediate() {}
                                    }
                                {
                                    constructor(a, b) {
                                    super();
                                }
                                leaf() {}
                        }`
                    } as EJSON));
            }
        );

        it('should serialize a leaf class that has a constructor without arguments with its parent classes',
            () => {
                expect(withUnformattedStrings(toEJSON(LeafWithoutArgs)))
                    .toMatchObject(withUnformattedStrings({
                        "_!_": `class LeafWithoutArgs extends
                                    class Intermediate extends
                                        class Root {
                                            root() {}
                                        }
                                    {
                                        intermediate() {}
                                    }
                                {
                                    constructor() {
                                    super();
                                }
                                leaf() {}
                        }`
                    } as EJSON));
            }
        );

        it('should serialize a function', () => {
            expect(toEJSON(() => 1)).toMatchObject({"_!_": "() => 1"});
        });

        it('should serialize all supported types', () => {
                expect(withUnformattedStrings(toEJSON({
                    a: 1,
                    b: "string",
                    c: true,
                    d: null,
                    e: [1, 2, (a: number) => a, Root],
                    f: {
                        g: "nested",
                        h: [1, 2, (a: number) => a, Root]
                    }
                }))).toMatchObject(withUnformattedStrings({
                    a: 1,
                    b: "string",
                    c: true,
                    d: null,
                    e: [1, 2, {"_!_": "(a) => a"}, {"_!_": "class Root { root() {} }"}],
                    f: {
                        g: "nested",
                        h: [1, 2, {"_!_": "(a) => a"}, {"_!_": "class Root { root() {} }"}]
                    }
                }));
            }
        );
    });
}