import React, {ReactElement, useContext} from "react";
import {OnboardingStepperContext} from "./OnboardingStepper.tsx";

export interface OnboardingStepProps {
    label: string;
    step_key: string;
    children?: ReactElement<OnboardingStepContentProps>;
}

export interface OnboardingStepContentProps {
    setCompleted?: (completed: boolean) => void;
}

const OnboardingStep = ({step_key, children}: OnboardingStepProps) => {
    const stepperContext = useContext(OnboardingStepperContext);

    return (
        <>
            {React.Children.map(children, child => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(
                        child as React.ReactElement<OnboardingStepContentProps>,
                        {
                            setCompleted:
                                (completed: boolean) => stepperContext.setCompleted(step_key, completed)
                        }
                    );
                }
                return child;
            })
            }
        </>
    );
}

export default OnboardingStep;