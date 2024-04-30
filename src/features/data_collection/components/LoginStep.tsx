import {Grid, LinearProgress, Stack, Typography} from "@mui/material";
import Step from "./stepper/Step.tsx";
import {useSetStepState} from "./stepper/RouteStepper.tsx";
import Box from "@mui/material/Box";
import {Context, PipelineState, usePipelineState, useScraper} from "../../../lib/webview_scraper";
import login_modal_html from "../../../assets/login_modal.html?raw";
import {useEffect, useState} from "react";

interface LoginStepProps {

}

const LoginStep = ({}: LoginStepProps) => {
    const [pipelineState, setPipelineState] = usePipelineState();
    const [loginDetected, setLoginDetected] = useState(false);
    const scraper = useScraper();
    const setStepCompleted = useSetStepState();

    useEffect(() => {
        setStepCompleted(pipelineState === PipelineState.DONE);
    }, [pipelineState, setStepCompleted]);

    useEffect(() => {
        return scraper
            .begin(setPipelineState)
            .wait_for_url("*/NUI_FRAMEWORK.PT_LANDINGPAGE.GBL?")
            .task_with_context(Context, show_login_modal, [login_modal_html])
            .callback(() => setLoginDetected(true))
            .wait_for_event("current", "tauri://focus")
            .execute();
    }, [undefined, scraper, setPipelineState]);

    return (
        <Grid item xs={8} sm={6} md={5} lg={4} xl={4}>
            <Step title={"Login"}>
                <Stack spacing={2}>
                    <Typography variant={"body1"}>
                        The tool window should have opened. Please login as you normally would.
                        Once you have logged in, the tool will display a message to let you know that you can now come
                        back
                        to this window.
                    </Typography>
                    <Box>
                        <Typography variant={"body1"} fontWeight={600}>
                            Please, do not close the tool window after logging in!
                        </Typography>
                        <Typography variant={"body1"}>
                            You can minimize it instead.
                        </Typography>
                    </Box>
                </Stack>
                <Box my={4} display={"flex"} flexDirection={"column"} alignItems={"center"}>

                    {loginDetected &&
                        <>
                            <Typography variant={"body2"}>Login successful!</Typography>
                            <LinearProgress sx={{width: "100%"}} variant={"determinate"} value={100} color={"success"}/>
                        </>
                    }
                    {!loginDetected &&
                        <>
                            <Typography variant={"body2"}>Waiting for login...</Typography>
                            <LinearProgress sx={{width: "100%"}}/>
                        </>
                    }

                </Box>
            </Step>
        </Grid>
    );
};

export default LoginStep;


const show_login_modal = (ctx: Context, modal_html: string) => {
    const placeholder = document.createElement("div");
    placeholder.innerHTML = modal_html;
    document.body.appendChild(placeholder);
    const focus_button = document.getElementById("focus-main-window");
    if (!focus_button) throw new Error("Button not found");
    focus_button.onclick = async () => {
        await ctx.initiator.setFocus();
    };
}