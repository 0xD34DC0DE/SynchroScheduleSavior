import {open_webview, close_webview, webview_inject, Serializable} from "./commands.ts";
import {close_webview, open_webview} from "./commands.ts";

//TODO:
// Reflect on the least complicated method for handling the interval injections
// Method 1:
//  The intervals run on the initiator window and the true interval id is returned to the user
//  - Pros:
//      - The user can stop the interval from any context
//      - Managing the intervals is easier
//  - Cons:
//      - Need to listen for navigation events to re-inject the intervals or stop them
// Looks like this might be simpler to implement.
// The "global" vs "local" interval injection might be a feature creep since only the global injection
// is needed for the current use case.


type IntervalId = number;
type InjectionId = number;

type IntervalInjectionData = {
    current_id: IntervalId; // The id might change if the function is re-injected
    fn: string;
    args: Serializable[];
    interval: number;
    isOneShot: false;
};

class InjectableWindow {
    private static next_injection_id = 0;
    private readonly window_label: string;
    private readonly running_intervals: Map<InjectionId, IntervalInjectionData> = new Map();

    static async create(label: string, url: string): Promise<InjectableWindow> {
        await open_webview(label, url);
    static async create(label: string, title: string, url: string): Promise<InjectableWindow> {
        await open_webview(label, title, url);
        return new InjectableWindow(label);
    }

    public async close(): Promise<void> {
        for await (const interval_id of this.running_intervals.keys()) {
            await this.stopIntervalInjection(interval_id);
        }

        await close_webview(this.window_label);
    }

    private constructor(label: string) {
        this.window_label = label;
    }

    private static nextInjectionId(): InjectionId {
        return InjectableWindow.next_injection_id++;
    }

    /**
     *  Inject a function into the window at the specified interval.
     *
     * @param fn Function to inject
     * @param args Arguments to pass to the function
     * @param interval Interval in milliseconds
     * @param injectOnNavigation If true, the function will be injected into the current page and all future pages,
     *                           otherwise it will only be injected into the current page once and navigating
     *                           (or a refresh) will not re-inject the function. (default: true)
     *
     * @returns The interval id
     */
    public injectAtInterval(
        fn: (...args: Serializable[]) => Serializable,
        args: Serializable[],
        interval: number,
        injectOnNavigation: boolean = true
    ): InjectionId {
        const injection_id = InjectableWindow.nextInjectionId();

        const intervalFn = (id: number, fn: string, args: Serializable[]): void => {
            const fn_ = new Function(`return ${fn}`)();
            fn_(...args);
        };

        return injection_id;
    }

    public async stopIntervalInjection(interval_id: InjectionId): Promise<void> {
        const interval = this.running_intervals.get(interval_id);
        if (!interval) throw new Error(`No interval with id ${interval_id} is running`);

        const clearIntervalFn = (id: number): void => clearInterval(id);

        await webview_inject(
            this.window_label,
            InjectableWindow.nextInjectionId(),
            clearIntervalFn,
            [interval_id],
            true
        );

        this.running_intervals.delete(interval_id);
    }
}

