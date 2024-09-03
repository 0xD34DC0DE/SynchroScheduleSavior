import PipelineStep from "../pipeline_step.ts";
import {WebviewWindow} from "@tauri-apps/api/window";
import Injection from "../../injection.ts";
import {InjectedArgs, InjectedFunction} from "../../stubs";


class WhileTask<ConditionParams extends [...any], ConditionArgs extends [...any]> extends PipelineStep {
    private readonly _condition_type: ConditionType;
    private readonly _condition_fn: InjectedFunction<ConditionParams, ConditionArgs>;
    private readonly _condition_args: InjectedArgs<ConditionArgs, ConditionParams>;
    private readonly _fn: WhileCallback;
    private readonly _config = {max_iterations: Infinity};

    public readonly name: string = "WhileTask";

    constructor(
        condition_type: ConditionType,
        condition_fn: InjectedFunction<ConditionParams, ConditionArgs>,
        condition_args: InjectedArgs<ConditionArgs, ConditionParams>,
        fn: WhileCallback,
        config?: WhileTaskConfig
    ) {
        super();
        this._condition_type = condition_type;
        this._condition_fn = condition_fn;
        this._condition_args = condition_args;
        this._fn = fn;
        this._config = {...this._config, ...config};
    }

    public async run(target: WebviewWindow): Promise<void> {
        let condition_satisfied: boolean | undefined = undefined;
        const evaluate_condition = () => new Promise<void>((resolve, reject) => {
            this.add_listener(
                new Injection(this._condition_fn, this._condition_args)
                    .inject(
                        target,
                        result => {
                            if ("error" in result) {
                                reject(result.error);
                                return;
                            }
                            condition_satisfied = result.value === true;
                            resolve();
                        },
                        this.abort.bind(this)
                    )
            );
        });

        let iterations = 0;
        while (condition_satisfied !== false) {
            console.log("WhileTask iteration", iterations);
            if (iterations === this._config.max_iterations) {
                throw new Error("Max iterations reached");
            }

            if (this._condition_type === "pre-condition") {
                await evaluate_condition();
                if (!condition_satisfied) break;
            }

            await new Promise<void>((resolve, reject) => {
                try {
                    this._fn({iteration: iterations, condition_result: condition_satisfied}, resolve, (e) => {
                        console.log("WhileTask rejected", e);
                        reject(e);
                    });
                } catch (e) {
                    console.log("WhileTask iteration error", e);
                    reject(e);
                }
            });

            console.log("WhileTask fn complete");

            if (this._condition_type === "post-condition") {
                await evaluate_condition();
            }

            iterations++;
        }

        this.complete();
    }
}

type ConditionType = "pre-condition" | "post-condition";

type WhileTaskConfig = {
    max_iterations?: number;
}

type IterationData = {
    iteration: number;
    condition_result?: boolean;
}

type WhileCallback = (
    iteration_data: IterationData,
    on_complete: () => void,
    on_error: (error: any) => void
) => void;

export type {ConditionType, WhileTaskConfig, IterationData, WhileCallback};
export default WhileTask;

