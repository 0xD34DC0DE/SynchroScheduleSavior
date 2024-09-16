import {Grid, Stack, Typography} from "@mui/material";
import AnimatedEllipsis from "../AnimatedEllipsis.tsx";

interface SemesterDataCollectorStatusProps {
    description: string;
    status: string;
}

const SemesterDataCollectorStatus = ({description, status}: SemesterDataCollectorStatusProps) => {
    return (
        <Grid item display={"flex"} justifyContent={"center"} alignItems={"center"}>
            <Stack>
                <AnimatedEllipsis variant={"body2"}>{description}</AnimatedEllipsis>
                <Typography variant={"caption"}>{status}</Typography>
            </Stack>
        </Grid>
    );
}

export default SemesterDataCollectorStatus;