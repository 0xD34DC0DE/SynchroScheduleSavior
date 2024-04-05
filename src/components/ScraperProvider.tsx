import ScraperContextType from "../contexts/ScraperContext.ts";
import {createContext, ReactNode, useContext, useEffect, useRef} from "react";
import {Context, ContextFactory, defaultContextFactory} from "../scraper/src/context.ts";
import {TaskPipeline} from "../scraper/src/pipeline/task_pipeline.ts";
import {matchPath, useBlocker, useNavigate} from "react-router-dom";

interface ScraperProviderProps {
    scraperContext: ScraperContextType;
    windowClosedRedirectPath: string;
    guardPath: string;
    children: ReactNode;
}

const ScraperContext = createContext<ScraperContextType>({});


function useScraper(): TaskPipeline<Context>;
function useScraper<Ctx extends Context>(scraper_context_factory: ContextFactory<Ctx>): TaskPipeline<Ctx>;

function useScraper<Ctx extends Context = Context>(scraper_context_factory?: ContextFactory<Ctx>): TaskPipeline<Ctx> | TaskPipeline<Context> {
    const context = useContext(ScraperContext);
    if (!context.web_scraper) {
        throw new Error("Scraper not initialized");
    }

    if (!scraper_context_factory) {
        return context.web_scraper.begin(defaultContextFactory);
    } else {
        return context.web_scraper.begin(scraper_context_factory);
    }
}

export {useScraper};

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