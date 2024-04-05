import {LinearProgress, Stack, Typography} from "@mui/material";

export interface ScraperLoadingIndicatorProps {

}

const ScraperLoadingIndicator = ({}: ScraperLoadingIndicatorProps) => {
    return (
        <Stack>
            <Typography>Loading scraper...</Typography>
            <LinearProgress/>
        </Stack>
    );
};

export default ScraperLoadingIndicator;