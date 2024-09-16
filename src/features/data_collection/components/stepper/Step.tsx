import StepCard, {StepCardProps} from "./StepCard.tsx";
import {ButtonLink} from "../../../../components/navigation";
import {useStepData, useStepState} from "./RouteStepper.tsx";

interface StepProps extends Omit<StepCardProps, "action"> {

}

const Step = ({title, children}: StepProps) => {
    const {complete, isLastStep, nextPath} = useStepState();
    const [stepData, _] = useStepData<any>();

    return (
        <StepCard
            title={title}
            actions={
                <ButtonLink to={nextPath} replace disabled={!complete} variant={"contained"} state={stepData}>
                    {isLastStep ? "Finish" : "Next"}
                </ButtonLink>
            }
        >
            {children}
        </StepCard>
    );
};

export default Step;
