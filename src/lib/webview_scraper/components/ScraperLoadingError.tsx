import {Divider, Paper, Stack, Typography} from "@mui/material";
import {WarningOutlined} from "@mui/icons-material";
import {useAsyncError} from "react-router-dom";
import Box from "@mui/material/Box";

interface ScraperLoadingErrorProps {
}

const ScraperLoadingError = ({}: ScraperLoadingErrorProps) => {
    const error = useAsyncError() as Error;

    return (
        <Paper>
            <Stack p={2} spacing={2}>
                <Stack direction="row" spacing={2} alignItems={"center"}>
                    <WarningOutlined fontSize={"large"} color={"error"}/>
                    <Typography variant={"h5"}>Failed to load scraper</Typography>
                </Stack>
                <Divider/>
                <Box>
                    <Typography pb={0.5}>Reason:</Typography>
                    <Paper>
                        <Box p={1} sx={{backdropFilter: "contrast(90%)"}}>
                            <Typography>{error.message}</Typography>
                        </Box>
                    </Paper>
                </Box>
            </Stack>
        </Paper>
    );
};

export default ScraperLoadingError;
