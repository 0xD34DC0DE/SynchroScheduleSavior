import ScraperContextType from "../contexts/ScraperContext.ts";
import {createContext, ReactNode, useState} from "react";
import {InjectableWindow} from "../scraper";

interface ScraperProviderProps {
    children: ReactNode;
}

export const ScraperContext = createContext<ScraperContextType>({
    _details: {
        _init: async () => {
            throw new Error("_init called outside of ScraperProvider context");
        },
        _close: function (): void {
            throw new Error("_close called outside of ScraperProvider context");
        }
    }
});

const ScraperProvider = ({children}: ScraperProviderProps) => {
    const [context, _setContext] = useState<ScraperContextType>({
        _details: {
            _init: (args) => InjectableWindow.create(args.label, args.title, args.url).then(() => {}),
            _close: () => {}
        }
    });

    return (
        <ScraperContext.Provider value={context}>
            {children}
        </ScraperContext.Provider>
    );
};

export default ScraperProvider;