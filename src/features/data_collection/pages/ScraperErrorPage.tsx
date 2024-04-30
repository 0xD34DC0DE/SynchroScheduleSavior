import {Grid, Paper, Typography} from "@mui/material";
import {useRouteError} from "react-router-dom";
import Box from "@mui/material/Box";
import GridLayout from "../../../components/layouts/GridLayout.tsx";
import {Warning} from "@mui/icons-material";

interface ScraperErrorPageProps {

}

const ScraperErrorPage = ({}: ScraperErrorPageProps) => {
    const error = useRouteError() as Error;

    return (
        <GridLayout justifyContent={"center"} alignItems={"center"}>
            <Grid item xs={7}>
                <Paper elevation={2}>
                    <Box p={2}>
                        <Box display={"flex"} alignItems={"center"}>
                            <Warning fontSize={"large"} color={"error"}/>
                            <Typography variant={"h4"} ml={1} my={1}>{error?.name ?? "Error"}</Typography>
                        </Box>

                        <Typography variant={"body1"} mt={1}>An error occurred while collecting data.</Typography>

                        <Typography variant={"h5"} mt={2}>Cause: {error?.cause as string ?? "Unknown"}</Typography>

                        <Typography variant={"h5"} mt={2}>Message:</Typography>
                        <Box bgcolor={(theme) => theme.palette.error.light} mt={1} p={1} borderRadius={1}>
                            <Typography
                                variant={"body1"}
                                color={(theme) => theme.palette.getContrastText(theme.palette.error.light)}
                            >
                                {error?.message ?? error?.cause ?? "Unknown error"}
                            </Typography>
                        </Box>

                        <Typography variant={"h5"} mt={2}>Stack trace:</Typography>
                        <Box bgcolor={(theme) => theme.palette.error.light} mt={1} p={1} borderRadius={1}>
                            <Typography
                                variant={"body2"}
                                color={(theme) => theme.palette.getContrastText(theme.palette.error.light)}
                            >
                                {error?.stack?.split("\n").map((line, index)  =>
                                    <>{index !== 0 && <><br/>&emsp;</>}{line}</>
                                ) ?? "Unknown error"}
                            </Typography>
                        </Box>
                    </Box>
                </Paper>
            </Grid>
        </GridLayout>
    );
};

export default ScraperErrorPage;
