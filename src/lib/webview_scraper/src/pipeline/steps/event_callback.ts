import PipelineStep from "../pipeline_step.ts";
import {getCurrent, WebviewWindow} from "@tauri-apps/api/window";
import {Event} from "@tauri-apps/api/event";

class EventCallback<T> extends PipelineStep {
    private readonly _target: "current" | "target";
    private readonly _event_name: string;
    private readonly _handler: EventHandler<T>;

    public readonly name: string = "EventCallback";

    constructor(target_window: "current" | "target",
                event_name: string,
                handler: EventHandler<T>) {
        super();
        this._target = target_window;
        this._event_name = event_name;
        this._handler = handler;
    }

    public async run(target: WebviewWindow): Promise<void> {
        const target_window = this._target === "current" ? getCurrent() : target;
        await this.add_listener(
            target_window.listen<T>(this._event_name, (event) => {
                if (this._handler(event)) this.complete();
            })
        );
    }
}

export default EventCallback;

type EventHandler<T> = (event: Event<T>) => boolean;
