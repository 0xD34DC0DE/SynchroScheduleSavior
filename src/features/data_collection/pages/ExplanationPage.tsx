import {ButtonLink} from "../../../components/navigation";
import {Grid, Typography} from "@mui/material";
import TooltipTypography from "../components/TooltipTypography.tsx";

interface ExplanationPageProps {
    startPath: string;
}

const ExplanationPage = ({startPath}: ExplanationPageProps) => {
    return (
        <Grid container item xs={12} sm={10} spacing={1}>
            <Grid item xs={12}>
                <Typography variant={"h2"} fontWeight={600}>
                    How it works
                </Typography>
            </Grid>

            <Grid container item xs={5} spacing={2}>
                <Grid item>
                    <Typography variant={"h4"} fontWeight={600}>
                        Step 1: Login
                    </Typography>
                    <Typography variant={"body1"}>
                        Once the tool is started, a new window will open at the login page.
                        Login as you normally would.
                        Don't worry,&nbsp;
                        <TooltipTypography
                            title={
                                "When you enter your credentials," +
                                " they are sent directly to the website you are logging into." +
                                " To prevent your credentials from being compromised, the tool does not store," +
                                " log or interact with them. This has the side effect that you will need to log in" +
                                " every time you start the data collection tool."
                            }
                            maxWidth={500}
                            display={"inline"}
                            component={"span"}
                            underline
                        >
                            this tool does not store your login information.
                        </TooltipTypography>
                    </Typography>
                </Grid>
                <Grid item>
                    <Typography variant={"h4"} fontWeight={600}>
                        Step 2: Login confirmation
                    </Typography>
                    <Typography variant={"body1"}>
                        One logged in, the tool will let you know that you have successfully logged in.
                        At this point,&nbsp;
                        <TooltipTypography
                            title={
                                "The tool window needs to stay open to collect data." +
                                " See the next step for more information."
                            }
                            maxWidth={500}
                            display={"inline"}
                            component={"span"}
                            underline
                        >
                            do not close the tool window!
                        </TooltipTypography>
                    </Typography>
                </Grid>
                <Grid item>
                    <Typography variant={"h4"} fontWeight={600}>
                        Step 3: Data collection
                    </Typography>
                    <Typography variant={"body1"}>
                        Once you are back in the application window, the tool will start collecting data.
                        This process is&nbsp;
                        <TooltipTypography
                            title={
                                "To reduce the time it takes to collect data, the tool will only collect relevant" +
                                " data. This means that the application will ask you to perform choices so that it" +
                                " can instruct the tool on what data to collect. The interactions are done on the" +
                                " application window, not the tool window."
                            }
                            maxWidth={500}
                            display={"inline"}
                            component={"span"}
                            underline
                        >
                            interactive
                        </TooltipTypography>
                        &nbsp;and will guide you through the data collection process.
                    </Typography>
                </Grid>
            </Grid>

            <Grid container item xs={12} justifyContent="flex-end">
                <ButtonLink to={startPath} variant="contained">Start</ButtonLink>
            </Grid>
        </Grid>
    );
};

export default ExplanationPage;
