import {WindowCreateArgs} from "../contexts/ScraperContext.ts";
import {Route} from "react-router-dom";
import {ReactNode, useContext} from "react";
import ScraperContextType from "../contexts/ScraperContext.ts";
import {ScraperContext} from "./ScraperProvider.tsx";
import {WebviewWindow} from "@tauri-apps/api/window";

interface ScraperLoaderProps {
    windowArgs: WindowCreateArgs;
    onWindowClose?: () => void;
    children?: ReactNode;
}

const ScraperLoader = ({windowArgs, onWindowClose, children}: ScraperLoaderProps) => {
    const {_details} = useContext<ScraperContextType>(ScraperContext);

    const load = async () => {
        await _details._init(windowArgs);
        const webview = WebviewWindow.getByLabel(windowArgs.label);
        if (!webview) {
            throw new Error("Failed to get webview window with label: " + windowArgs.label);
        }

        _details._window = webview;
        _details._window_close_unlisten = await webview.once("tauri://destroyed", () => {
            _details._close();
        });

        _details._close = () => {
            _details._window_close_unlisten?.();
            _details._window_close_unlisten = undefined;

            WebviewWindow.getByLabel(windowArgs.label)?.close();
            _details._window = undefined;

            onWindowClose?.();
        }
    }

    return (
        <Route loader={load}>
            {children}
        </Route>
    );
}

export default ScraperLoader;