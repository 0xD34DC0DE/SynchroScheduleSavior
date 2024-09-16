import PipelineStep from "../pipeline_step.ts";

class Callback extends PipelineStep {
    private readonly _callback: () => void;

    public readonly name: string = "Callback";

    constructor(callback: () => void) {
        super();
        this._callback = callback;
    }

    public async run(): Promise<void> {
        try {
            this._callback();
        } catch (error) {
            this.abort(error);
        }
        this.complete();
    }
}

export default Callback;
