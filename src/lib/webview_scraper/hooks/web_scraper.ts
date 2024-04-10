import WebScraper from "../src/web_scraper.ts";
import {useContext} from "react";
import { ScraperContext } from "../components/ScraperProvider.tsx";

const useScraper = (): WebScraper => {
    const context = useContext(ScraperContext);
    if (!context.web_scraper) {
        throw new Error("Scraper not initialized");
    }
    return context.web_scraper;
}

export default useScraper;