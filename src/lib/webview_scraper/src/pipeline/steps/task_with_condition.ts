import PipelineStep from "../pipeline_step.ts";
import {WebviewWindow} from "@tauri-apps/api/window";
import Injection from "../../injection.ts";
import Context, {ConditionConfig} from "../../context.ts";
import {ObservedMutation} from "../types.ts";

class TaskWithCondition extends PipelineStep {
    private readonly _fn: (...args: any) => void;
    private readonly _args: any[];
    private readonly _condition_config: ConditionConfig;
    private readonly _condition: (mutations: ObservedMutation[]) => boolean;

    public readonly name: string = "TaskWithCondition";

    constructor(
        injected_fn: (...args: any) => void,
        args: any[],
        condition: (mutations: ObservedMutation[]) => boolean,
        condition_config: Omit<ConditionConfig, "condition_event_id" | "condition_met_event_id">
    ) {
        super();
        this._fn = injected_fn;
        this._args = args;
        this._condition_config = {
            ...condition_config,
            condition_event_id: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(),
            condition_met_event_id: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(),
        };
        this._condition = condition;
    }

    public async run(target: WebviewWindow): Promise<void> {
        await this.add_listener(
            target.listen<ObservedMutation[]>(this._condition_config.condition_event_id.toString(), async (event) => {
                console.log("Condition event received", event.payload);
                if (this._condition(event.payload)) {
                    console.log("(Task) Condition met", this._condition_config.condition_met_event_id);
                    await target.emit(this._condition_config.condition_met_event_id.toString()).then(() => {
                        console.log("Condition met event emitted", this._condition_config.condition_met_event_id);
                        this.complete();
                    });
                }
            })
        );

        const observer_injection = new Injection(
            (ctx: Context, config: ConditionConfig) => {ctx.observe_condition(config);},
            [this._condition_config],
            {context_prototypes: [Context]}
        );

        await this.add_listener(
            observer_injection.inject(target)
        );

        const task_injection = new Injection(
            this._fn,
            this._args,
        );

        await this.add_listener(
            task_injection.inject(target)
        );
    }
}

export default TaskWithCondition;
