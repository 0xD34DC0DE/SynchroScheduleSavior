import Step from "./stepper/Step.tsx";
import {Button} from "@mui/material";
import {useSetStepState} from "./stepper/RouteStepper.tsx";

interface SemesterSelectionStepProps {

}

const SemesterSelectionStep = ({}: SemesterSelectionStepProps) => {
    const setStepCompleted = useSetStepState();

    return (
        <Step title={"Semester selection"}>
            <Button onClick={() => setStepCompleted?.(true)}>Selected</Button>
            <Button onClick={() => setStepCompleted?.(false)}>Not Selected</Button>
        </Step>
    );
};

export default SemesterSelectionStep;
