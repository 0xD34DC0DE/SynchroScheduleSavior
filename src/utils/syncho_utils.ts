// import Scraper from "../apis/Scraper.ts";
// import UrlPattern from "url-pattern";
// import Semester from "../models/Semester.ts";
// import {Event as TEvent} from "@tauri-apps/api/event";
//
// // Stubs for functions that are defined in Synchro
// declare function pingServer(url: string): void;
//
// declare function setupTimeout2(): void;
//
// declare function closeLastModal(): void;
//
// declare const ghmob: JQueryStatic;
//
// export const sessionKeepAlive = async (scraper: Scraper) => {
//     await scraper.inject(() => {
//         pingServer(window.location.href.replace(/(['"\\])/g, "\\$&"));
//         setupTimeout2();
//         closeLastModal();
//     }, "undefined", 1000).catch(e => console.error(e));
// }
//
// export const showLoggedInModal = async (scraper: Scraper, message: string) => {
//     const fn = (message: string) => {
//         ghmob("body").append(
//             ghmob("<div>")
//                 .attr("id", "synchro-logged-in-modal")
//                 .html(message)
//                 .css({
//                     "position": "fixed",
//                     "display": "flex",
//                     "justify-content": "center",
//                     "align-items": "center",
//                     "width": "100%",
//                     "height": "100%",
//                     "top": "0",
//                     "left": "0",
//                     "right": "0",
//                     "bottom": "0",
//                     "background-color": "rgba(0,0,0,0.7)",
//                     "color": "white",
//                     "backdrop-filter": "blur(5px)",
//                     "z-index": "9999",
//                 })
//         );
//     }
//
//     await scraper.injectWithArgs(fn, "undefined", 500, [message])
//         .catch(e => console.error(e));
// }
//
// export type CancelablePromise<T> = {
//     cancel: () => void,
//     promise: Promise<T>
// }
//
// const incompleteCancelablePromise = <T>(): { cancel: () => void, promise?: Promise<T> } => ({
//     cancel: () => ({}),
// });
//
// const removeCancelCallback = <T>(obj: T extends { cancel: () => void } ? T : never) => ({
//     ...obj,
//     cancel: () => ({})
// });
//
// export const waitForNavigation = <P>(
//     scraper: Scraper,
//     pattern: UrlPattern,
//     callback: (() => Promise<((event: TEvent<string>) => Promise<P>)>),
//     once: boolean = true
// ): CancelablePromise<Awaited<P>> => {
//     let ret = incompleteCancelablePromise<P>();
//
//     ret.promise = new Promise<P>(async (resolve, reject) => {
//         let cb: ((event: TEvent<string>) => Promise<P>) | undefined = undefined;
//         console.log("listen", pattern);
//         const unlisten = await scraper.onNavigationEvent(pattern, event => {
//             if (once) {
//                 unlisten();
//                 console.log("unlisten", pattern);
//             }
//             removeCancelCallback(ret);
//             cb?.(event)?.then(p => resolve(p));
//         });
//         ret.cancel = () => {
//             unlisten();
//             console.log("unlisten", pattern);
//             reject("cancelled")
//         };
//         callback().then(c => cb = c);
//     });
//
//     return ret as CancelablePromise<Awaited<P>>;
// }
//
// export const navigateTo = (scraper: Scraper, path: string, timeout_ms: number, url_pattern?: UrlPattern): CancelablePromise<string> => {
//     let pattern = url_pattern || new UrlPattern(path);
//
//     return waitForNavigation(scraper, pattern, async () =>
//         scraper.navigateToPath(path, timeout_ms)
//             .then(() => async event => event.payload)
//     );
// }
//
// export const clickOnElementAndWaitForNavigation = (scraper: Scraper,
//                                                    selector: string,
//                                                    pattern: UrlPattern,
//                                                    timeout_ms: number
// ): CancelablePromise<string> => {
//     return waitForNavigation(scraper, pattern, async () =>
//         scraper.injectWithArgs(
//             (selector: string) => {
//                 ghmob(selector).trigger("click")
//             },
//             "undefined",
//             timeout_ms,
//             [selector]
//         ).then(() => async (event) => event.payload)
//     );
// }
//
// export const navigateToStudentCenter = (scraper: Scraper): CancelablePromise<string> => {
//     return navigateTo(scraper,
//         "/psc/acprpr9/EMPLOYEE/SA/c/SA_LEARNER_SERVICES.SSS_STUDENT_CENTER.GBL",
//         1000,
//         new UrlPattern("*/SA_LEARNER_SERVICES.SSS_STUDENT_CENTER.GBL*")
//     );
// }
//
// export const getAvailableSemesters = async (scraper: Scraper): Promise<Semester[]> => {
//     const fn = (): Semester[] => {
//         const a =  ghmob("#SSR_DUMMY_RECV1\\$scroll\\$0");
//         const b = a.find("ul.gridformatter");
//         const c = b.find("li");
//         const d = c.find("a");
//         console.log(a, b, c, d);
//         return d.children()
//             .toArray()
//             .map((el) =>
//                 $(el).find("p").toArray().map((el) => $(el).text())
//             )
//             .map(semester => ({
//                 term: semester[0],
//                 cycle: semester[1],
//                 courses: {}
//             }));
//     }
//
//     return scraper.inject(fn, "object", 1000);
// }