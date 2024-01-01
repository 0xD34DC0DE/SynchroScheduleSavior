import {useScraperStore} from "../stores/ScraperStore.ts";
import {useUserConnectionStore} from "../stores/UserSessionStore.ts";
import {alpha, Button, Typography, useTheme} from "@mui/material";
import {useEffect} from "react";
import {UrlPattern} from "../apis/Scraper.ts";
import {showLoggedInModal} from "../utils/syncho_utils.ts";
import {Link} from "react-router-dom";
import CheckIcon from "@mui/icons-material/Check";
import FlexBox from "./FlexBox.tsx";
import {OnboardingStepContentProps} from "./OnboardingStep.tsx";

export interface LoginStepProps extends OnboardingStepContentProps {
}

const LoginStep = ({setCompleted}: LoginStepProps) => {
    const open = useScraperStore(state => state.open);
    const scraper = useScraperStore(state => state.scraper);
    const setLoggedIn = useUserConnectionStore(state => state.setLoggedIn);
    const loggedIn = useUserConnectionStore(state => state.loggedIn);
    const theme = useTheme();

    const openScraper = async () => {
        if (scraper) return;
        await open("synchro", "Synchro - Scraper", "https://academique-dmz.synchro.umontreal.ca/");
    }

    useEffect(() => {
        if (!scraper) return;
        const unlisten =
            scraper.onNavigationEvent(
                new UrlPattern("*/NUI_FRAMEWORK.PT_LANDINGPAGE.GBL?"),
                async () => {
                    setLoggedIn(true);
                    unlisten.then(f => f());
                    await showLoggedInModal(scraper,
                        "You have successfully logged in to Synchro! " +
                        "Leave this window open and return to the app.",
                    );
                }
            );
        return () => {
            unlisten.then(f => f());
        };
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
            <Button
                onClick={startLogin}
                variant={"contained"}
                color={loggedIn ? "success" : "primary"}
                endIcon={loggedIn && <CheckIcon/>}
                sx={{
                    alignSelf: "center",
                    mt: 2,
                    pointerEvents: loggedIn ? "none" : "auto",
                    ...loggedIn ? {backgroundColor: alpha(theme.palette.success.main, 0.6)} : {},
                }}
            >
                {loggedIn ? "Login successful" : "Open Synchro Login"}
            </Button>
        </FlexBox>
    );
}

export default LoginStep;
