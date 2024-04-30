import {Grid, Paper, Typography} from "@mui/material";
import Box from "@mui/material/Box";
import GridLayout from "../../../components/layouts/GridLayout.tsx";
import {Warning} from "@mui/icons-material";
import {ButtonLink} from "../../../components/navigation";

interface ScraperClosedPageProps {

}

const ScraperClosedPage = ({}: ScraperClosedPageProps) => {
    return (
        <GridLayout justifyContent={"center"} alignItems={"center"}>
            <Grid item xs={4}>
                <Paper elevation={2}>
                    <Box p={2}>
                        <Box display={"flex"} alignItems={"center"}>
                            <Warning fontSize={"large"} color={"warning"}/>
                            <Typography variant={"h4"} ml={1} my={1}>Tool window closed</Typography>
                        </Box>

                        <Typography variant={"body1"} mt={1}>
                            The window of the data collection tool has been closed while it was running.
                        </Typography>

                        <Typography variant={"body1"}>
                            Please, restart the data collection process.
                        </Typography>

                        <Box mt={2} display={"flex"} justifyContent={"center"}>
                            <ButtonLink to={".."} variant={"contained"} color={"primary"} >Restart</ButtonLink>
                        </Box>
                    </Box>
                </Paper>
            </Grid>
        </GridLayout>
    );
};

export default ScraperClosedPage;
