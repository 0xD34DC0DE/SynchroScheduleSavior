import PipelineStep from "../pipeline_step.ts";
import {WebviewWindow} from "@tauri-apps/api/window";
import Injection from "../../injection.ts";
import makeHTMLElementProxy, {HTMLElementProxy} from "../../stubs/html_element.ts";
import "../../injection_handler.d.ts";

class ForEachTask<T extends HTMLElement> extends PipelineStep {
    private readonly _selector: string;
    private readonly _fn: ForEachCallback<T>;

    public readonly name: string = "ForEachTask";

    constructor(
        selector: string,
        fn: ForEachCallback<T>,
    ) {
        super();
        this._selector = selector;
        this._fn = fn;
    }

    public async run(target: WebviewWindow): Promise<void> {
        const query_and_persist = (selector: string) => {
            const elements = document.querySelectorAll(selector);
            if (elements === null) throw new Error(`Not elements found for selector: ${selector}`);

            return Array.from(elements)
                .map(element => {
                    if (!(element instanceof HTMLElement)) throw new Error(`Element is not an HTMLElement: ${element}`);
                    return __INJECTOR_ELEMENT_TRACKER__.track_element(element);
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
                                makeHTMLElementProxy(element_id),
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

type ForEachCallback<T extends HTMLElement> = (element: HTMLElementProxy<T>, on_complete: () => void) => void;