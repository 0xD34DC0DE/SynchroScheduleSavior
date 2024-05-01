
export type ObservedMutation = {
    target: string;
    attributeName: string | null;
    currentValue: string | null;
    oldValue: string | null;
}