import PipelineStep from "../pipeline_step.ts";
import {WebviewWindow} from "@tauri-apps/api/window";
import Injection from "../../injection.ts";
import {Selector} from "../../stubs";
import {Resolved} from "../../stubs/resolvable.ts";


class TaskWithCondition<T extends HTMLElement> extends PipelineStep {
    private readonly _fn: (...args: any) => void;
    private readonly _args: any[];
    private readonly _condition_config: ConditionConfig<T>;
    private readonly _condition: ConditionCallback

    public readonly name: string = "TaskWithCondition";

    constructor(
        injected_fn: (...args: any) => void,
        args: any[],
        condition: ConditionCallback,
        condition_config: ConditionConfig<T>
    ) {
        super();
        this._fn = injected_fn;
        this._args = args;
        this._condition_config = condition_config;
        this._condition = condition;
    }

    public async run(target: WebviewWindow): Promise<void> {
        // return new Promise<void>((resolve, reject) => {
        //     new MutationObserver((mutations, observer) => {
        //         for (let mutation of mutations) {
        //             if (condition(mutation)) {
        //                 observer.disconnect();
        //                 resolve();
        //             }
        //         }
        //     }).observe(element, configs.observer_config);
        //
        //     setTimeout(() => reject(new Error("Observer timed out")), 10000);
        // })


        await this.add_listener(
            new Injection(
                (fn: Function, fnArgs: any[], condition: ConditionCallback, configs: ResolvedConditionConfig<T>) => {
                    return new Promise<void>((resolve, reject) => {
                        new MutationObserver((mutations, observer) => {
                            for (let mutation of mutations) {
                                if (condition(mutation)) {
                                    observer.disconnect();
                                    resolve();
                                }
                            }
                        }).observe(configs.selector(), configs.observer_config);

                        setTimeout(() => reject(new Error("Observer timed out")), 10000);
                    })
                }
                , [this._fn, this._args, this._condition, this._condition_config]
            ).inject(target)
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

type ResolvedConditionConfig<T extends HTMLElement> = {
    selector: () => {}//Resolved<ConditionConfig<T>["selector"]>;
    observer_config: MutationObserverInit;
}