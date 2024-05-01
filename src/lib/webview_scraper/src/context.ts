import {WebviewWindow} from "@tauri-apps/api/window";
import {ObservedMutation} from "./pipeline/types.ts";
//import {ObservedMutation} from "./pipeline/steps/task_with_condition.ts";

/**
 * The label used to identify the window that initiated the scraper
 * @see [injection_handler.js]{@link https://github.com/0xD34DC0DE/SynchroScheduleSavior/blob/e701df6ac78925c3b31fae8b036994f170257846/src-tauri/src/webview_inject/injection_handler.js}
 */
declare const initiator_label: string;

declare global {
    interface Window {
        __TAURI__: {
            window: {
                WebviewWindow: typeof WebviewWindow
            }
        }
    }
}

class Context {
    public get initiator(): WebviewWindow {
        const initiator = window.__TAURI__.window.WebviewWindow.getByLabel(initiator_label);
        if (!initiator) {
            throw new Error("Could not find initiator window with label: " + initiator_label);
        }
        return initiator;
    }

    public observe_condition(config: ConditionConfig): void {
        const element = document.querySelector(config.selector);
        if (!element) {
            throw new Error(`Element not found: ${config.selector}`);
        }

        const initiator = this.initiator;

        const observer = new MutationObserver(async (mutations) => {
            const observed_mutations: ObservedMutation[] = mutations.map(mutation => ({
                target: mutation.target.toString(),
                attributeName: mutation.attributeName,
                oldValue: mutation.oldValue,
                currentValue: (mutation.target as Element).getAttribute(mutation.attributeName ?? ""),
            }));

            await initiator.emit(config.condition_event_id, observed_mutations);
        });

        let listening = true;

        initiator.once(config.condition_met_event_id, () => {
            observer.disconnect();
            listening = false;
        }).then(unlisten =>
            setTimeout(() => {
                unlisten();
                if (listening) throw new Error("Observer time out");
            }, 10000)
        );

        observer.observe(element, config.mutation_observer_config);
    }
}

export type {ConditionConfig};
export default Context;

type ConditionConfig = {
    condition_event_id: string;
    condition_met_event_id: string;
    selector: string;
    mutation_observer_config: MutationObserverInit;
}
