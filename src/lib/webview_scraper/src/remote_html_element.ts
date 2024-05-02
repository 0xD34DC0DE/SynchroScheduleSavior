type HTMLElementConstructor<T extends HTMLElement> = new () => T & {_remote_id_?: string};

type RemoteHTMLElement<T extends HTMLElement> = HTMLElement & T & {_remote_id_?: string};

const make_remote_element = <T extends HTMLElement>(ctor: HTMLElementConstructor<T>, remote_id: string): RemoteHTMLElement<T> => {
    const mock_element = new ctor();
    mock_element._remote_id_ = remote_id;

    return new Proxy(mock_element, {
        get: function (target, prop, receiver) {
            if (prop in mock_element) {
                throw new Error(`Cannot get property ${String(prop)} on RemoteHTMLElement outside of injection context`);
            }
            return Reflect.get(target, prop, receiver);
        },
        set: function (target, prop, value, receiver) {
            if (prop in mock_element) {
                throw new Error(`Cannot set property ${String(prop)} on RemoteHTMLElement outside of injection context`);
            }
            return Reflect.set(target, prop, value, receiver);
        },
        apply: function (_target, _thisArg, _argumentsList) {
            throw new Error(`Function invocation is not allowed on RemoteHTMLElement outside of injection context`);
        }
    });
}

export type {RemoteHTMLElement, HTMLElementConstructor};
export default make_remote_element;