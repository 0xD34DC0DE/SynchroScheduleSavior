import ScraperContextType from "../contexts/ScraperContext.ts";
import {createContext, ReactNode, useContext, useEffect, useRef, useState} from "react";
import {matchPath, useBlocker, useNavigate} from "react-router-dom";
import {WebScraper} from "../scraper/src/web_scraper.ts";
import { PipelineState } from "../scraper/src/pipeline/task_pipeline.ts";

interface ScraperProviderProps {
    scraperContext: ScraperContextType;
    windowClosedRedirectPath: string;
    guardPath: string;
    children: ReactNode;
}

const ScraperContext = createContext<ScraperContextType>({});

export const useScraper = (): WebScraper => {
    const context = useContext(ScraperContext);
    if (!context.web_scraper) {
        throw new Error("Scraper not initialized");
    }
    return context.web_scraper;
}

export const usePipelineState = () => useState<PipelineState>(PipelineState.IDLE);

const ScraperProvider = ({scraperContext, windowClosedRedirectPath, guardPath, children}: ScraperProviderProps) => {
    const navigate = useNavigate();
    const closeCallbackSet = useRef(false);

    // Abusing useBlocker a little bit to get a callback when there's a navigation
    useBlocker(({nextLocation}) => {
        if (!matchPath(`${guardPath}/*`, nextLocation.pathname)) {
            scraperContext.web_scraper?.close();
        }
        return false;
    });

    useEffect(() => {
        if (closeCallbackSet.current) return;

        scraperContext.web_scraper?.onDestroy(() => {
            navigate(windowClosedRedirectPath);
        });
        closeCallbackSet.current = true;
    }, [scraperContext.web_scraper]);

    return (
        <ScraperContext.Provider value={scraperContext}>
            {children}
        </ScraperContext.Provider>
    );
};

export default ScraperProvider;