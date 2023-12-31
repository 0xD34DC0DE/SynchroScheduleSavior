import {useScraperStore} from "../stores/ScraperStore.ts";
import {useUserConnectionStore} from "../stores/UserSessionStore.ts";
import {Typography} from "@mui/material";
import {useEffect} from "react";
import {UrlPattern} from "../apis/Scraper.ts";
import {showLoggedInModal, waitForNavigation} from "../utils/syncho_utils.ts";
import {Link} from "react-router-dom";

import FlexBox from "./FlexBox.tsx";
import {OnboardingStepContentProps} from "./OnboardingStep.tsx";
import CompletableButton from "./CompletableButton.tsx";

export interface LoginStepProps extends OnboardingStepContentProps {
}

const LoginStep = ({setCompleted}: LoginStepProps) => {
    const open = useScraperStore(state => state.open);
    const scraper = useScraperStore(state => state.scraper);
    const setLoggedIn = useUserConnectionStore(state => state.setLoggedIn);
    const loggedIn = useUserConnectionStore(state => state.loggedIn);

    const openScraper = async () => {
        if (scraper) return;
        await open("synchro", "Synchro - Scraper", "https://academique-dmz.synchro.umontreal.ca/");
    }

    useEffect(() => {
        if (!scraper) return;
        let urlPattern = new UrlPattern("*/NUI_FRAMEWORK.PT_LANDINGPAGE.GBL?");
        let nav = waitForNavigation(scraper, urlPattern, async () =>
            async () => {
                setLoggedIn(true);
                await showLoggedInModal(scraper,
                    "You have successfully logged in to Synchro! " +
                    "Leave this window open and return to the app.",
                );
            }
        );
        nav.promise.catch(e => {
            if (e !== "cancelled") console.error(e)
        });
        return nav.cancel;
    }, [scraper]);

    useEffect(() => setCompleted?.(loggedIn), [loggedIn, setCompleted]);

    const startLogin = async () => await openScraper();

    return (
        <FlexBox grow={1} direction={"column"} gap={1}>
            <Typography variant={"h6"}>
                To collect semester data, you must first login to your Synchro account.
            </Typography>
            <Typography variant={"body1"}>
                After clicking the button below, a new window will open where you can login to your Synchro
                account. The app will let you know when you have successfully logged in.
            </Typography>
            <Typography variant={"body2"}>
                Note: Synchro is a third-party website that is not affiliated with this app.
                If you'd like to know how this app uses your Synchro account to gather semester data,
                please read the <Link to={"/about"}>about page</Link>.
            </Typography>
            <CompletableButton
                completed={loggedIn}
                onClick={startLogin}
                variant={"contained"}
                sx={{alignSelf: "center", mt: 2}}
                successElement={"Login successful"}
            >
                Open Synchro Login
            </CompletableButton>
        </FlexBox>
    );
}

export default LoginStep;
