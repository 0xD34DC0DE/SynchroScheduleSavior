import {create} from "zustand";
import Scraper from "../apis/Scraper";

export interface ScraperStore {
    scraper: Scraper | null;
    open: (window_label: string, title: string, url: string) => Promise<void>;
    close: () => Promise<void>;
}

export const useScraperStore = create<ScraperStore>((set, get) => ({
    scraper: null,
    open: async (window_label: string, title: string, url: string) => {
        const scraper = await Scraper.open(window_label, title, url);
        set({scraper: scraper});
    },
    close: async () => {
        let scraper = get().scraper;
        if (scraper !== null) {
            await scraper.close();
            set({scraper: null});
        }
    },
}));