import {WebviewWindow} from "@tauri-apps/api/window";

export type WindowCreateArgs = {
    label: string,
    title: string,
    url: string
}

interface ScraperContextType {
    _details: {
        _init: (args: WindowCreateArgs) => Promise<void>;
        _window?: WebviewWindow;
        _close: () => void;
        _window_close_unlisten?: () => void;
    }
}

export default ScraperContextType;