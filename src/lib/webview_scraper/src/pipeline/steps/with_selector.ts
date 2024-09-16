import {WebviewWindow} from "@tauri-apps/api/window";
import PipelineStep from "../pipeline_step.ts";
import {HTMLElementProxy, makeHTMLElementProxy} from "../../stubs";
import Injection from "../../injection.ts";

class WithSelector<T extends HTMLElement> extends PipelineStep {
    private readonly _selector: string;
    private readonly _fn: WithSelectorCallback<T>;

    public readonly name = "WithSelector";

    constructor(
        selector: string,
        fn: WithSelectorCallback<T>,
    ) {
        super();
        this._selector = selector;
        this._fn = fn;
    }

    public async run(target: WebviewWindow): Promise<void> {
        const query_and_persist = (selector: string) => {
            const element = document.querySelector(selector);
            if (element === null) return;
            if (!(element instanceof HTMLElement)) throw new Error(`Element is not an HTMLElement: ${element}`);
            return __INJECTOR_ELEMENT_TRACKER__.track_element(element);
        };

        await this.add_listener(
            new Injection(
                query_and_persist,
                [this._selector],
            ).inject(
                target,
                async (result) => {
                    if ("error" in result) throw new Error(result.error);

                    if (!result.value && this.is_running()) {
                        this.complete();
                        return;
                    }

                    await new Promise<void>((resolve, reject) => {
                        this._fn(
                            makeHTMLElementProxy(result.value),
                            resolve,
                            reject,
                        );
                    });

                    if (this.is_running()) this.complete();
                },
                this.abort.bind(this)
            )
        );
    }

}

export default WithSelector;

type WithSelectorCallback<T extends HTMLElement> = (
    element: HTMLElementProxy<T>,
    on_complete: () => void,
    on_error: (error: any) => void,
) => void;