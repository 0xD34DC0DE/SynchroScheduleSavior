import PipelineStep from "../pipeline_step.ts";
import {WebviewWindow} from "@tauri-apps/api/window";
import Injection from "../../injection.ts";
import Context from "../../context.ts";
import {once} from "@tauri-apps/api/event";


class TaskWithCondition extends PipelineStep {
    private readonly _fn: (...args: any) => void;
    private readonly _args: any[];
    private readonly _condition_config: ConditionConfig;
    private readonly _condition: ConditionCallback

    public readonly name: string = "TaskWithCondition";

    constructor(
        injected_fn: (...args: any) => void,
        args: any[],
        condition: ConditionCallback,
        condition_config: ConditionConfig
    ) {
        super();
        this._fn = injected_fn;
        this._args = args;
        this._condition_config = condition_config;
        this._condition = condition;
    }

    public async run(target: WebviewWindow): Promise<void> {

        const setup_observer = (ctx: Context,
                                observer_ready_event_id: string,
                                configs: ConditionConfig,
                                condition: ConditionCallback) => {
            const element = document.querySelector(configs.selector);
            if (element === null) throw new Error(`Element not found: ${configs.selector}`);

            return new Promise<void>((resolve, reject) => {
                new MutationObserver((mutations, observer) => {
                    for (let mutation of mutations) {
                        if (condition(mutation)) {
                            observer.disconnect();
                            resolve();
                        }
                    }
                }).observe(element, configs.observer_config);

                setTimeout(() => reject(new Error("Observer timed out")), 10000);

                ctx.initiator.emit(observer_ready_event_id, {});
            });
        }

        const observer_ready_event_id = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString();

        await this.add_listener(
            once(observer_ready_event_id, async () => {
                await this.add_listener(
                    new Injection(this._fn, this._args, {allow_parallel: true}).inject(target)
                )
            })
        );

        await this.add_listener(
            new Injection(
                setup_observer,
                [observer_ready_event_id, this._condition_config, this._condition],
                {context_prototypes: [Context], allow_parallel: true}
            ).inject(
                target,
                (result) => {
                    if ("error" in result) throw new Error(result.error);
                    this.complete();
                }
            )
        );
    }
}

export type {ConditionConfig, ConditionCallback};
export default TaskWithCondition;

type ConditionCallback = (mutation: MutationRecord) => boolean;

type ConditionConfig = {
    selector: string;
    observer_config: MutationObserverInit;
}