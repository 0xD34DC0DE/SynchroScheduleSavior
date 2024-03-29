import {WebScrapper} from "../web_scraper.ts";
import {PipelineStep} from "./pipeline_step.ts";
import {Context} from "../context.ts";
import {Navigate} from "./steps/navigate.ts";
import {UrlWait} from "./steps/url_wait.ts";
import {Task} from "./steps/task.ts";
import {InjectionResult} from "../injection.ts";


class TaskPipeline<Ctx extends Context> {
    private readonly _web_scraper: WebScrapper<Ctx>;
    private readonly _steps: PipelineStep<Ctx>[] = [];
    private _cancel: (() => void) | null = null;

    constructor(web_scraper: WebScrapper<Ctx>) {
        this._web_scraper = web_scraper;
        console.log("(TaskPipeline) created")
    }

    public execute(
        on_complete: (context: Ctx) => void = () => {
        }
    ): () => void {
        console.log("(TaskPipeline) executing");
        (async () => {
            const context = this._web_scraper.context_factory.create();
            console.log("(TaskPipeline) context created");
            for (let step of this._steps) {
                this._cancel = () => step.cancel();
                console.log(`(TaskPipeline) executing step: '${step.name}'`);
                await step.run(this._web_scraper.window, context);
                console.log(`(TaskPipeline) step complete: '${step.name}'`);
            }
            console.log("(TaskPipeline) all steps complete");
            return context;
        })().then((ctx) => {
            console.log("(TaskPipeline) calling on_complete");
            on_complete(ctx);
        });

        return () => this._cancel?.();
    }

    public navigate_to(url: string, url_pattern?: string): TaskPipeline<Ctx> {
        this._steps.push(new Navigate(url, url_pattern));
        return this;
    }

    public wait_for_url(url_pattern: string): TaskPipeline<Ctx> {
        console.log("(TaskPipeline) adding new task: UrlWait");
        this._steps.push(new UrlWait(url_pattern));
        return this;
    }

    public task<F extends (...args: Parameters<F>) => ReturnType<F>>(
        injected_fn: F,
        args: Parameters<F>,
        on_result: (result: InjectionResult<ReturnType<F>>) => void = () => {
        },
    ): TaskPipeline<Ctx> {
        console.log("(TaskPipeline) adding new task: Task");
        this._steps.push(new Task(injected_fn, args, on_result));
        return this;
    }
}

export {TaskPipeline};