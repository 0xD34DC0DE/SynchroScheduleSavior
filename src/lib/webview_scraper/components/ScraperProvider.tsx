import {ScraperContextType} from "../contexts";
import {createContext, ReactNode, useEffect, useRef} from "react";
import {matchPath, useBlocker, useNavigate} from "react-router-dom";

interface ScraperProviderProps {
    scraperContext: ScraperContextType;
    windowClosedRedirectPath: string;
    guardPath: string;
    children: ReactNode;
}

const ScraperContext = createContext<ScraperContextType>({});

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

export {ScraperContext};
export default ScraperProvider;
