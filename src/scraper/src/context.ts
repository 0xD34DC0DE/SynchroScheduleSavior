// ghmob is the jQuery object that is used in Synchro
// We declare it as a stub to provide typings for the jQuery object
declare const ghmob: JQueryStatic;

class Context {
    private readonly window_label: string;

    static begin(window_label: string, url: string): Promise<Context> {
        return new Context(window_label);
    }

    private constructor(window_label: string) {
        this.window_label = window_label;
    }
}


// Usage:
//
// import { Context } from './context';
//
// const start_page = await Context.begin("window_label", "https://example.com");
//
// const info_page =
//      await start_page
//          .findOne(<selector>)
//          .clickNavLink(); // This signature doesn't require an url: it will get the href from the element
//                           // alternatively, you can pass an url or urlPattern to clickNavLink
// // if we use start_page here, we will get an error as the info_page context is still open
// // we can close the info_page context by calling info_page.close()
// // or we can use .then(...) instead of await to close the context automatically but
// // this can lead to a lot of nested code
//
// const info_page =
//      await start_page
//          .findAll(<selector>)
//          .forEach(elem => {
//              const text = await elem.getText();
//           }, eager: true); // eager: true, will perform any context switch operations immediately
//                            // eager: false, run each callback in parallel until each callback is done
//                            // or they require a context switch
//                            // if a context switch is required by a callback,
//                            // the first callback that requires a context switch will be executed
//                            // once all callbacks are done or blocked (Mutex)
//
