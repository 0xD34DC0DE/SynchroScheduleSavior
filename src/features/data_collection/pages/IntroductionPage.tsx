import StepCard from "../components/stepper/StepCard.tsx";
import {Link} from "../../../components/navigation";
import {Typography} from "@mui/material";

interface IntroductionPageProps {
    startPath: string;
}

const IntroductionPage = ({startPath}: IntroductionPageProps) => {
    return (
        <StepCard
            title={"Introduction"}
            actions={<Link to={startPath}>Get started</Link>}
        >
            <Typography>
                Welcome to the data collection tool!
            </Typography>
        </StepCard>
    );
};

export default IntroductionPage;
