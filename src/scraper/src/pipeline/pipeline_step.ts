import {Context} from "../context.ts";
import {InjectableWindow} from "../window.ts";
import {UnlistenFn} from "@tauri-apps/api/event";


abstract class PipelineStep<Ctx extends Context> {
    private _unlisten_fn: (() => void) | null = null;
    private _promise_reject: ((reason?: any) => void) | null = null;
    private _resolve: ((value: (PromiseLike<Ctx> | Ctx)) => void) | null = null;
    private _context: Ctx | null = null;

    public abstract readonly name: string;

    public abstract run(target_window: InjectableWindow, context: Context, ...args: any[]): Promise<Ctx>;

    public cancel(): void {
        this._reject("Cancelled");
    }

    protected async begin(
        context: Ctx,
        listener: Promise<UnlistenFn>,
        on_listener_ready: () => void = () => {}
    ): Promise<Ctx> {
        console.log("(PipelineStep) begin");
        return await new Promise<Ctx>((resolve, reject) => {
            console.log("(PipelineStep) waiting for listener");
            this._promise_reject = reject;
            this._resolve = resolve;
            this._context = context;
            listener.then(unlisten => {
                this._unlisten_fn = unlisten;
                console.log("(PipelineStep) listener ready, calling on_listener_ready");
                on_listener_ready();
            }).catch((e) => this._reject(e));
        });
    }

    protected complete(): void {
        console.log("(PipelineStep) completing");
        if (!this._context) throw new Error("Cannot complete step that has not started");
        this._unlisten();
        this._promise_reject = null;
        this._resolve?.(this._context);
    }

    protected abort(reason: any): void {
        console.log("(PipelineStep) aborting: ", reason);
        this._reject(reason);
    }

    private _unlisten(): void {
        console.log("(PipelineStep) unlisten");
        this._unlisten_fn?.();
        this._unlisten_fn = null;
    }

    private _reject(reason: any): void {
        console.log("(PipelineStep) rejected: ", reason);
        this._unlisten();
        this._promise_reject?.(reason);
        this._promise_reject = null;
    }
}

export {PipelineStep};