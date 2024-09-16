import PipelineStep from "../pipeline_step.ts";
import {WebviewWindow} from "@tauri-apps/api/window";
import Injection from "../../injection.ts";
import {Selector} from "../../stubs";

class TaskWithCondition<T extends HTMLElement> extends PipelineStep {

    private readonly _on_condition_met: (mutation: MutationRecord) => void;
    private readonly _observer_config: MutationObserverInit
    private readonly _condition: ConditionCallback;
    private readonly _selector: Selector<HTMLElement>;

    public readonly name: string = "TaskWithCondition";

    //TODO: Add timeout
    constructor(
        condition: ConditionCallback,
        condition_config: ConditionConfig<T>,
        on_condition_met: (mutation: MutationRecord) => void = () => {
        }
    ) {
        super();
        this._condition = condition;
        this._observer_config = condition_config.observer_config;
        this._selector = condition_config.selector;
        this._on_condition_met = on_condition_met;
    }

    public async run(target: WebviewWindow): Promise<void> {

        await this.add_listener(
            new Injection(
                (
                    on_condition_met: (mutation: MutationRecord) => void,
                    condition: (m: MutationRecord) => boolean,
                    observer_target: HTMLElement,
                    observer_configs: MutationObserverInit,
                ) => {
                    return new Promise<void>((resolve, reject) => {
                        new MutationObserver((mutations, observer) => {
                            for (let mutation of mutations) {
                                if (condition(mutation)) {
                                    observer.disconnect();
                                    on_condition_met(mutation);
                                    resolve();
                                }
                            }
                        }).observe(observer_target, observer_configs);

                        setTimeout(() => reject(new Error("Observer timed out")), 10000);
                    })
                },
                [
                    this._on_condition_met,
                    this._condition,
                    this._selector,
                    this._observer_config,
                ]
            ).inject(
                target,
                () => this.complete(),
                this.abort.bind(this)
            )
        );
    }
}

export type {ConditionConfig, ConditionCallback};
export default TaskWithCondition;

type ConditionCallback = (mutation: MutationRecord) => boolean;

type ConditionConfig<T extends HTMLElement> = {
    selector: Selector<T>;
    observer_config: MutationObserverInit;
}
