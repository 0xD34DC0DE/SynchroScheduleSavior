import {Context} from "../../context.ts";
import {InjectableWindow} from "../../window.ts";
import {PipelineStep} from "../pipeline_step.ts";
import {InjectionResult} from "../../injection.ts";

class Task<Ctx extends Context, F extends (...args: Parameters<F>) => ReturnType<F>> extends PipelineStep<Ctx> {
    private readonly _fn: F;
    private readonly _args: Parameters<F>;
    private readonly _on_result: (result: InjectionResult<ReturnType<F>>) => void;

    public readonly name: string = "Task";

    constructor(
        injected_fn: F,
        args: Parameters<F>,
        on_result: (result: InjectionResult<ReturnType<F>>) => void = () => {},
    ) {
        super();
        this._fn = injected_fn;
        this._args = args;
        this._on_result = on_result;
    }

    public async run(target_window: InjectableWindow, context: Ctx): Promise<Ctx> {
        console.log("(PipelineStep::Task) running");
        return this.begin(
            context,
            target_window.inject(this._fn, this._args, (r) => {
                console.log("(PipelineStep::Task) result received: ", r);
                this.complete();
                console.log("(PipelineStep::Task) calling on_result");
                this._on_result(r);
            }),
        );
    }
}

export { Task };