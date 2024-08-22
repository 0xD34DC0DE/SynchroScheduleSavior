declare global {
    const __INJECTOR_ELEMENT_TRACKER__:{
        track_element(element: HTMLElement): string;

        get_element(id: string): HTMLElement;
    }
}

export {};
