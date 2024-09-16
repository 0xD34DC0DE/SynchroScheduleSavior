import {ButtonLink} from "../../../components/navigation";
import {Grid, Typography} from "@mui/material";

interface IntroductionPageProps {
    linkPath: string;
}

const IntroductionPage = ({linkPath}: IntroductionPageProps) => {
    return (
        <Grid container item xs={12} sm={4} rowSpacing={2}>
            <Grid item xs={12}>
                <Typography variant={"h3"}>
                    Data Collection
                </Typography>
            </Grid>

            <Grid item xs={12}>
                <Typography variant={"body1"}>
                    Welcome to the data collection tool.
                </Typography>
                <Typography variant={"body1"}>
                    This tool will guide you through the process of collecting data
                    that will be used throughout the application.
                </Typography>
            </Grid>

            <Grid container item xs={12} justifyContent="flex-end">
                <ButtonLink to={linkPath} variant="contained">Get started</ButtonLink>
            </Grid>
        </Grid>
    );
};

export default IntroductionPage;
