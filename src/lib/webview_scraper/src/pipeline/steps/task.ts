import PipelineStep from "../pipeline_step.ts";
import Injection, {InjectionResultCallbackFor} from "../../injection.ts";
import {WebviewWindow} from "@tauri-apps/api/window";
import {InjectedFunction, InjectedArgs} from "../../stubs";


class Task<Args extends [...any], Params extends [...any]> extends PipelineStep {
    private readonly _fn: InjectedFunction<Params, Args>;
    private readonly _args: InjectedArgs<Args, Params>;
    private readonly _on_result: InjectionResultCallbackFor<InjectedFunction<Params, Args>>;

    public readonly name: string = "Task";

    constructor(
        injected_fn: InjectedFunction<Params, Args>,
        args: InjectedArgs<Args, Params>,
        on_result: InjectionResultCallbackFor<InjectedFunction<Params, Args>> = () => {
        },
    ) {
        super();
        this._fn = injected_fn;
        this._args = args;
        this._on_result = on_result;
    }

    public async run(target: WebviewWindow): Promise<void> {
        const injection = new Injection(
            this._fn,
            this._args,
        );

        await this.add_listener(
            injection.inject(
                target,
                (result) => {
                    this._on_result(result);
                    this.complete();
                },
                this.abort.bind(this)
            )
        );
    }
}

export default Task;