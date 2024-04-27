import {Button} from "@mui/material";
import Step from "./stepper/Step.tsx";
import {useSetStepState} from "./stepper/RouteStepper.tsx";

interface LoginStepProps {

}

const LoginStep = ({}: LoginStepProps) => {
    const setStepCompleted = useSetStepState();

    return (
        <Step title={"Login"}>
            <Button onClick={() => setStepCompleted?.(true)}>Login</Button>
            <Button onClick={() => setStepCompleted?.(false)}>Logout</Button>
        </Step>
    );
};

export default LoginStep;
