import StepCard, {StepCardProps} from "./StepCard.tsx";
import {ButtonLink} from "../../../../components/navigation";
import {useStepState} from "./RouteStepper.tsx";

interface StepProps extends Omit<StepCardProps, "action"> {

}

const Step = ({title, children}: StepProps) => {
    const {complete, isLastStep, nextPath} = useStepState();

    return (
        <StepCard
            title={title}
            actions={
                <ButtonLink to={nextPath} replace disabled={!complete} variant={"contained"}>
                    {isLastStep ? "Finish" : "Next"}
                </ButtonLink>
            }
        >
            {children}
        </StepCard>
    );
};

export default Step;
