// ghmob is the jQuery object that is used in Synchro
// We declare it as a stub to provide typings for the jQuery object
declare const ghmob: JQueryStatic;

class Context {
}

interface ContextFactory<Ctx extends Context> {
    create(): Ctx;
}

const defaultContextFactory: ContextFactory<Context> = {
    create: () => new Context()
};

export {Context, defaultContextFactory};
export type {ContextFactory};
