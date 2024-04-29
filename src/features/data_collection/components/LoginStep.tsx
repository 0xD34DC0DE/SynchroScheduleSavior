import {Button, Grid, LinearProgress, Stack, Typography} from "@mui/material";
import Step from "./stepper/Step.tsx";
import {useSetStepState} from "./stepper/RouteStepper.tsx";
import Box from "@mui/material/Box";

interface LoginStepProps {

}

const LoginStep = ({}: LoginStepProps) => {
    const setStepCompleted = useSetStepState();

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
                    <Typography variant={"body2"} my={1}>Waiting for login...</Typography>
                    <LinearProgress sx={{width: "100%"}}/>
                </Box>
            </Step>
        </Grid>
    );
};

export default LoginStep;
