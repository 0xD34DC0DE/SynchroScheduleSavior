import {CssBaseline} from "@mui/material";
import FlexBox from "../components/FlexBox.tsx";
import {Outlet, useNavigate} from "react-router-dom";
import useDataStore from "../stores/dataStore.ts";
import {useEffect} from "react";
import {useUserConnectionStore} from "../stores/UserSessionStore.ts";
import {useScraperStore} from "../stores/ScraperStore.ts";
import {sessionKeepAlive} from "../utils/syncho_utils.ts";

export interface RootProps {
}

const Root = ({}: RootProps) => {
    const loggedIn = useUserConnectionStore(state => state.loggedIn);
    const setLoggedIn = useUserConnectionStore(state => state.setLoggedIn);
    const scraper = useScraperStore(state => state.scraper);
    const dataHasHydrated = useDataStore(state => state._hasHydrated);
    const navigate = useNavigate();

    useEffect(() => {
        if (dataHasHydrated) navigate("/landing");
    }, [dataHasHydrated]);

    useEffect(() => {
        if (loggedIn && scraper) {
            const millisecondsPerMinute = 1000 * 60;
            const sessionKeepAliveInterval = setInterval(async () => {
                await sessionKeepAlive(scraper);
            }, millisecondsPerMinute * 5);

            return () => clearInterval(sessionKeepAliveInterval);
        }
    }, [loggedIn,]);

    useEffect(() => {
        if (!scraper) setLoggedIn(false);
    }, [scraper]);

    return (
        <CssBaseline>
            <FlexBox sx={{width: "100%", height: "100%", backgroundColor: "rgb(255,247,240)"}}
                     horizontalAlignment={"center"} verticalAlignment={"center"}>
                <Outlet/>
            </FlexBox>
        </CssBaseline>
    );
};

export default Root;