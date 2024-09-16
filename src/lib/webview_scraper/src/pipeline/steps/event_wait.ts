import PipelineStep from "../pipeline_step.ts";
import {getCurrent, WebviewWindow} from "@tauri-apps/api/window";

class EventWait extends PipelineStep {
    private readonly _mode: EventWaitMode;
    private readonly _target: EventWaitTarget;
    private readonly _event_names: string[];
    private readonly _on_complete?: () => void;

    public readonly name: string = "EventWait";

    constructor(target_window: EventWaitTarget,
                mode: EventWaitMode,
                event_names: string[],
                on_complete?: () => void) {
        if (event_names.length === 0) throw new Error("EventWait requires at least one event name");
        super();
        this._target = target_window;
        this._mode = mode;
        this._event_names = event_names;
        this._on_complete = on_complete;
    }

    public async run(target: WebviewWindow): Promise<void> {
        const event_promises = this._event_names.map((event_name) =>
            new Promise<void>(async (resolve) => {
                const target_window = this._target === "current" ? getCurrent() : target;

                await this.add_listener(
                    target_window.once(event_name, () => resolve())
                )
            })
        );

        this._mode === "all" ? await Promise.all(event_promises) : await Promise.race(event_promises);

        this._on_complete?.();
        this.complete();
    }
}

type EventWaitMode = "all" | "any";
type EventWaitTarget = "current" | "target";

export type {EventWaitMode, EventWaitTarget};
export default EventWait;
