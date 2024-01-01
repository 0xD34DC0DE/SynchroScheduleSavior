import {alpha, Button, Paper, Stack, Step, StepLabel, Stepper, Typography, useTheme} from "@mui/material";
import CheckIcon from '@mui/icons-material/Check';
import {ReactNode, useEffect, useState} from "react";
import FlexBox from "../components/FlexBox.tsx";
import Box from "@mui/material/Box";
import {Link} from "react-router-dom";
import {useScraperStore} from "../stores/ScraperStore.ts";
import {UrlPattern} from "../apis/Scraper.ts";
import {useUserConnectionStore} from "../stores/UserSessionStore.ts";
import {showLoggedInModal} from "../utils/syncho_utils.ts";

export interface DataCollectionPageProps {

}

const steps: { label: string, content: (setCompleted: (completed: boolean) => void) => ReactNode }[] =
    [
        {
            label: "Login",
            content: (setCompleted: (completed: boolean) => void) => {
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
                    console.log("useEffect", scraper);
                    if (!scraper) return;
                    console.log("Listening for navigation event...");
                    const unlisten =
                        scraper.onNavigationEvent(
                            new UrlPattern("*/NUI_FRAMEWORK.PT_LANDINGPAGE.GBL?"),
                            async () => {
                                console.log("Logged in!");
                                setLoggedIn(true);
                                unlisten.then(f => f());
                                await showLoggedInModal(scraper,
                                    "You have successfully logged in to Synchro! " +
                                    "Leave this window open and return to the app.",
                                );
                            }
                        );
                    return () => {
                        unlisten.then(f => {
                            console.log("Unlistening for navigation event...");
                            f();
                        })
                    };
                }, [scraper]);

                useEffect(() => {
                    setCompleted(loggedIn);
                    console.log("setCompleted", loggedIn);
                }, [loggedIn, setCompleted]);

                const startLogin = async () => await openScraper();

                return (<>
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
                            ... loggedIn ? {backgroundColor: alpha(theme.palette.success.main, 0.6)} : {},
                        }}
                    >
                        {loggedIn ? "Login successful" : "Open Synchro Login"}
                    </Button>
                </>);
            }
        },
        {
            label: "Semesters",
            content: (setCompleted: (completed: boolean) => void) => {
                return (<>

                </>);
            }
        },
    ];

const DataCollectionPage = ({}: DataCollectionPageProps) => {
    const [activeStep, setActiveStep] = useState(0);
    const [canContinue, setCanContinue] = useState(false);

    const onFinalStepComplete = () => {
        // TODO - Save data
    };

    return (
        <Paper sx={{p: 2, maxWidth: "75%", minWidth: "50%"}} elevation={2}>
            <Stepper activeStep={activeStep} sx={{pb: 3}}>
                {steps.map(({label}) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>
            <Box sx={{width: "100%", height: "100%"}}>
                <Paper variant={"outlined"} sx={{p: 2, mb: 2}}>
                    <FlexBox grow={1} direction={"column"} gap={1}>
                        {steps[Math.min(activeStep, steps.length)]
                            .content(setCanContinue)
                        }
                    </FlexBox>
                </Paper>
                <Stack direction={"row"} justifyContent={"end"}>
                    {activeStep === steps.length ?
                        <Button
                            onClick={onFinalStepComplete}
                            variant={"contained"}
                        >
                            Finish
                        </Button>
                        :
                        <Button
                            disabled={!canContinue}
                            onClick={() => setActiveStep(currentStep => currentStep + 1)}
                            variant={"contained"}
                        >
                            Continue
                        </Button>
                    }
                </Stack>
            </Box>
        </Paper>
    );
};

export default DataCollectionPage;