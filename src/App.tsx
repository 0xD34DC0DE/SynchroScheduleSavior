import {Button, Paper} from "@mui/material";
import FlexBox from "./components/FlexBox.tsx";
import {useEffect, useState} from "react";
import {useUserConnectionStore} from "./stores/UserSessionStore.ts";
import {useScraperStore} from "./stores/ScraperStore.ts";
import {UrlPattern} from "./apis/Scraper";
import Box from "@mui/material/Box";

//"https://academique-dmz.synchro.umontreal.ca"

function App() {
    const loggedIn = useUserConnectionStore(state => state.loggedIn);
    const setLoggedIn = useUserConnectionStore(state => state.setLoggedIn);
    const openScraper = useScraperStore(state => state.open);
    const scraper = useScraperStore(state => state.scraper);
    const [navigationPattern, setNavigationPattern] = useState<UrlPattern | null>(null);

    const startScraper = async () => {
        if (scraper) return;
        await openScraper("synchro", "Synchro - Scraper", "https://academique-dmz.synchro.umontreal.ca/");
    }

    const sessionKeepAlive = async () => {
        await scraper?.inject(() => {
            // @ts-ignore
            pingServer(window.location.href.replace(/(['"\\])/g, "\\$&"));
            // @ts-ignore
            setupTimeout2();
            // @ts-ignore
            closeLastModal();
        }, "undefined", 1000).catch(e => console.error(e));
    }

    const stopScraper = async () => {
        if (!scraper) return;
        await scraper.close();
    }

    useEffect(() => {
        if (loggedIn && scraper) {
            const sessionKeepAliveInterval = setInterval(async () => {
                await sessionKeepAlive();
            }, 1000 * 60 * 5);

            return () => clearInterval(sessionKeepAliveInterval);
        }
    }, [loggedIn]);

    const listenNavigation = async () => {
        if (!scraper) return;
        setNavigationPattern(new UrlPattern("*/NUI_FRAMEWORK.PT_LANDINGPAGE.GBL?"));
    }

    useEffect(() => {
        if (!scraper || !navigationPattern) return;
        const unlisten =
            scraper.onNavigationEvent(navigationPattern, () => setLoggedIn(true));

        return () => {unlisten.then(f => f())};
    }, [navigationPattern]);

    return (
        <FlexBox sx={{width: "100%", height: "100%", backgroundColor: "rgb(255,247,240)"}}
                 horizontalAlignment={"center"} verticalAlignment={"center"}>
            <Paper sx={{p: 2}} elevation={2}>
                <FlexBox gap={"2rem"}>
                    <Button onClick={startScraper}>Begin scraping</Button>
                    <Button onClick={stopScraper}>Stop scraping</Button>
                    <Button onClick={listenNavigation}>Listen navigation</Button>
                    <Box sx={{width: "2rem", height: "2rem", backgroundColor: loggedIn ? "rgb(132,224,92)" : "rgb(220,88,88)"}}/>
                </FlexBox>
            </Paper>
        </FlexBox>
    );
}

export default App;
