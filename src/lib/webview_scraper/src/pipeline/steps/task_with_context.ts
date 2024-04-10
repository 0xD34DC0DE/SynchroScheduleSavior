import Context from "../../context.ts";
import PipelineStep from "../pipeline_step.ts";
import Injection, {InjectionResult, ParametersWithoutContext, TaskWithContextFn} from "../../injection.ts";
import {WebviewWindow} from "@tauri-apps/api/window";

type ContextConstructor<Ctx extends Context> = new () => Ctx;

class TaskWithContext<Ctx extends Context, F extends (...args: any) => any> extends PipelineStep {
    private readonly _fn: TaskWithContextFn<Ctx, F>;
    private readonly _args: ParametersWithoutContext<F>;
    private readonly _context_ctor: ContextConstructor<Ctx>;
    private readonly _on_result?: (result: InjectionResult<ReturnType<F>>) => void;

    public readonly name: string = "TaskWithContext";

    constructor(
        context_ctor: ContextConstructor<Ctx>,
        injected_fn: TaskWithContextFn<Ctx, F>,
        args: ParametersWithoutContext<F>,
        on_result?: (result: InjectionResult<ReturnType<F>>) => void
    ) {
        super();
        this._fn = injected_fn;
        this._args = args;
        this._context_ctor = context_ctor;
        this._on_result = on_result;
    }


    // TODO: Remove all the Ctx stuff, apart from this class
    //
    private _extract_prototype_chain(): Function[] {
        const prototypes: Function[] = [this._context_ctor];
        let current = Object.getPrototypeOf(this._context_ctor);
        while (current.name !== "") {
            prototypes.push(current);
            current = Object.getPrototypeOf(current);
        }
        return prototypes;
    }

    public async run(target: WebviewWindow): Promise<void> {
        const prototypes = this._extract_prototype_chain();

        const injection = new Injection(
            this._fn,
            this._args,
            {
                context_prototypes: prototypes,
            }
        );

        await this.add_listener(
            injection.inject(target, (result) => {
                this._on_result?.(result);
                this.complete();
            })
        );
    }
}

export default TaskWithContext;
