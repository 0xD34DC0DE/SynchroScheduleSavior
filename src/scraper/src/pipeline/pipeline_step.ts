import {Context} from "../context.ts";
import {UnlistenFn} from "@tauri-apps/api/event";
import {WebviewWindow} from "@tauri-apps/api/window";


type ResolveFn = () => void;
type RejectFn = (error: Error) => void;

export abstract class PipelineStep {
    private readonly _listeners: Array<UnlistenFn> = [];
    private _resolve: ResolveFn | null = null;
    private _reject: RejectFn | null = null;

    public abstract readonly name: string;

    protected abstract run(target: WebviewWindow, context: Context, ...args: any[]): Promise<void>;

    public async execute(target: WebviewWindow, context: Context, ...args: any[]): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
            await this.run(target, context, ...args);
        }).catch((error) => {
            console.error(`(PipelineStep) Error in step '${this.name}':`, error);
            throw error;
        }).finally(() => this._cleanup());
    }

    protected async add_listener(listener: Promise<UnlistenFn>) {
        console.log(`(PipelineStep) Adding listener to step '${this.name}'`);
        this._listeners.push(await listener);
    }

    protected complete() {
        if (!this._resolve) throw new Error("(PipelineStep) Cannot complete step that is not running");
        this._resolve();
    }

    public cancel() {
        if (!this._reject) throw new Error("(PipelineStep) Cannot cancel step that is not running");
        this._reject(new Error("Cancelled"));
    }

    private _cleanup() {
        this._listeners.forEach(unlisten => unlisten());
        this._listeners.length = 0;
        this._resolve = null;
        this._reject = null;
    }
}
