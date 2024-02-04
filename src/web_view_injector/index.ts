import { InjectionArgs as TargetedInjectionArgs } from "./src/cmd.ts";

export type InjectionArgs = Omit<TargetedInjectionArgs, "injectionTarget">;

export {
    create_window,
    close_window,
    inject,
    await_injection,
    cancel_injection
} from "./src/cmd";


