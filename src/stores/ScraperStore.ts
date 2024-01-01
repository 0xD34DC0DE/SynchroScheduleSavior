import {create} from "zustand";
import Scraper from "../apis/Scraper";
import {once} from "@tauri-apps/api/event";

export interface ScraperStore {
    scraper: Scraper | null;
    open: (window_label: string, title: string, url: string) => Promise<void>;
    close: () => Promise<void>;
    _unlistenClose: (() => void) | null;
}

export const useScraperStore = create<ScraperStore>((set, get) => ({
    _unlistenClose: null,
    scraper: null,
    open: async (window_label: string, title: string, url: string) => {
        const scraper = await Scraper.open(window_label, title, url);
        once<null>("tauri://close-requested", (event) => {
            if (event.windowLabel === window_label) {
                set({scraper: null});
            }
        }).then((unlisten) => {
            set({_unlistenClose: unlisten, scraper: scraper});
        });
    },
    close: async () => {
        let scraper = get().scraper;
        if (scraper !== null) {
            get()._unlistenClose?.();
            await scraper.close();
            set({scraper: null, _unlistenClose: null});
        }
    },
}));