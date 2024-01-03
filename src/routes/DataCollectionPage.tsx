import LoginStep from "../components/LoginStep.tsx";
import OnboardingStepper from "../components/OnboardingStepper.tsx";
import OnboardingStep from "../components/OnboardingStep.tsx";
import SemesterSelectionStep from "../components/SemesterSelectionStep.tsx";

export interface DataCollectionPageProps {

}

const DataCollectionPage = ({}: DataCollectionPageProps) => {
    return (
        <OnboardingStepper
            paperProps={{
                sx: {maxWidth: "75%", minWidth: "50%"},
            }}
            onFinalStepComplete={() => {
            }}
        >
            <OnboardingStep label={"Login"} step_key={"login"}>
                <LoginStep/>
            </OnboardingStep>
            <OnboardingStep label={"Semesters"} step_key={"semesters"}>
                <SemesterSelectionStep/>
            </OnboardingStep>
        </OnboardingStepper>
    );
};

export default DataCollectionPage;