
export type OmitWithPrefix<P extends string, T> = {
    [K in keyof T as K extends `${P}${any}` ? never : K]: T[K]
};
