import { Paper } from "@mui/material";
import FlexBox from "../components/FlexBox";

export interface LandingPageProps {
}

const LandingPage = ({}: LandingPageProps) => {
    return (
        <Paper sx={{p: 2}} elevation={2}>
            <FlexBox gap={"2rem"}>
            </FlexBox>
        </Paper>
    );
};

export default LandingPage;