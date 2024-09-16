import {Grid, Typography} from "@mui/material";
import {ButtonLink} from "../../../components/navigation";

interface DataCollectionCompletedPageProps {

}

const DataCollectionCompletedPage = ({}: DataCollectionCompletedPageProps) => {
    return (
        <Grid container item xs={12} sm={4} rowSpacing={2}>
            <Grid item xs={12}>
                <Typography variant={"h3"}>
                    Data Collection Completed
                </Typography>
            </Grid>

            <Grid item xs={12}>
                <Typography variant={"body1"}>
                    Congratulations! You have completed the data collection process.
                </Typography>
                <Typography variant={"body1"}>
                    The data you have collected will be used throughout the application.
                    You can now return to the home page.
                </Typography>
            </Grid>

            <Grid container item xs={12} justifyContent="flex-end">
                <ButtonLink to={"/"} variant="contained">Home</ButtonLink>
            </Grid>
        </Grid>
    );
};

export default DataCollectionCompletedPage;
