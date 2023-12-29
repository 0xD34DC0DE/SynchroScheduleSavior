import {Button, Paper} from "@mui/material";
import FlexBox from "./components/FlexBox.tsx";
import {useEffect} from "react";
import {useUserConnectionStore} from "./stores/UserSessionStore.ts";
import {useScraperStore} from "./stores/ScraperStore.ts";

function App() {
    const loggedIn = useUserConnectionStore(state => state.loggedIn);
    const openScraper = useScraperStore(state => state.open);
    const scraper = useScraperStore(state => state.scraper);

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

    const testInjection = async () => {
        try {
            const f = (): number => {
                console.log("shouldn't see this in main window");
                return [1, 2][1];
            };
            //await Scraper.navigateToPath("/psp/acprpr9/EMPLOYEE/SA/c/SA_LEARNER_SERVICES.SSS_STUDENT_CENTER.GBL", 1000);
            await scraper?.inject(f, "number", 1000).then((result) => console.log("got ", result));
        } catch (e) {
            console.error(e);
        }
    }

    useEffect(() => {
        if (loggedIn && scraper) {
            const sessionKeepAliveInterval = setInterval(async () => {
                await sessionKeepAlive();
            }, 1000 * 60 * 5);

            return () => clearInterval(sessionKeepAliveInterval);
        }
    }, [loggedIn]);

    return (
        <FlexBox sx={{width: "100%", height: "100%", backgroundColor: "rgb(255,247,240)"}}
                 horizontalAlignment={"center"} verticalAlignment={"center"}>
            <Paper sx={{p: 2}} elevation={2}>
                <FlexBox gap={"2rem"}>
                    <Button onClick={startScraper}>Begin scraping</Button>
                    <Button onClick={testInjection}>Test injection</Button>
                    <Button onClick={stopScraper}>Stop scraping</Button>
                </FlexBox>
            </Paper>
        </FlexBox>
    );
}

export default App;
