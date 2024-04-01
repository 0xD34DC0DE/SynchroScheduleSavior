import {Context} from "../../context.ts";
import {PipelineStep} from "../pipeline_step.ts";
import {Injection, InjectionResult} from "../../injection.ts";
import {WebviewWindow} from "@tauri-apps/api/window";

class Task<Ctx extends Context, F extends (...args: Parameters<F>) => ReturnType<F>> extends PipelineStep {
    private readonly _fn: F;
    private readonly _args: Parameters<F>;
    private readonly _on_result: (result: InjectionResult<ReturnType<F>>) => void;

    public readonly name: string = "Task";

    constructor(
        injected_fn: F,
        args: Parameters<F>,
        on_result: (result: InjectionResult<ReturnType<F>>) => void = () => {
        },
    ) {
        super();
        this._fn = injected_fn;
        this._args = args;
        this._on_result = on_result;
    }

    public async run(target: WebviewWindow, _context: Ctx): Promise<void> {
        const injection = new Injection(
            this._fn,
            this._args,
        );

        await this.add_listener(
            injection.inject(target, (result) => {
                this._on_result(result);
                this.complete();
            })
        );
    }
}

export {Task};