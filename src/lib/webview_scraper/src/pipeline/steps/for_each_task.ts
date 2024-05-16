import PipelineStep from "../pipeline_step.ts";
import {WebviewWindow} from "@tauri-apps/api/window";
import Injection from "../../injection.ts";
import makeHTMLElementStub, {HTMLElementCtor, HTMLElementStub} from "../../stubs/html_element.ts";

class ForEachTask<T extends HTMLElement> extends PipelineStep {
    private readonly _selector: string;
    private readonly _element_type: HTMLElementCtor<T>;
    private readonly _fn: ForEachCallback<T>;

    public readonly name: string = "ForEachTask";

    constructor(
        selector: string,
        element_type: HTMLElementCtor<T>,
        fn: ForEachCallback<T>,
    ) {
        super();
        this._selector = selector;
        this._element_type = element_type;
        this._fn = fn;
    }

    public async run(target: WebviewWindow): Promise<void> {
        const query_and_persist = (selector: string) => {
            const elements = document.querySelectorAll(selector);
            if (elements === null) throw new Error(`Element not found: ${selector}`);
            const existing_elements = Object.entries(window.__INJECTOR_STATE__);

            return Array.from(elements)
                .map(element => {
                    if (!(element instanceof HTMLElement)) throw new Error(`Element is not an HTMLElement: ${element}`);
                    const existing_id = existing_elements.find(([_, existing_element]) => existing_element === element);
                    if (existing_id) return existing_id[0];
                    const element_id = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString();
                    window.__INJECTOR_STATE__[element_id] = element;
                    return element_id;
                });
        };

        await this.add_listener(
            new Injection(
                query_and_persist,
                [this._selector],
            ).inject(
                target,
                async (result) => {
                    if ("error" in result) throw new Error(result.error);
                    for (let element_id of result.value) {
                        await new Promise<void>(resolve => {
                            this._fn(
                                makeHTMLElementStub(this._element_type, element_id),
                                resolve,
                            );
                        });
                    }
                    this.complete();
                }
            )
        );
    }
}

export default ForEachTask;

type ForEachCallback<T extends HTMLElement> = (element: HTMLElementStub<T>, on_complete: () => void) => void;

declare const window: {
    __INJECTOR_STATE__: Record<string, HTMLElement>;
};