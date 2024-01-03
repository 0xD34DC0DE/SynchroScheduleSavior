import React, {createContext, isValidElement, ReactElement, useCallback, useState} from "react";
import {Button, Paper, PaperProps, Stack, Step, StepLabel, Stepper} from "@mui/material";
import Box from "@mui/material/Box";
import OnboardingStep, {OnboardingStepProps} from "./OnboardingStep.tsx";

export interface OnboardingStepperProps {
    onFinalStepComplete: () => void;
    paperProps?: PaperProps;
    children: ReactElement<OnboardingStepProps> | ReactElement<OnboardingStepProps>[];
}

export interface OnboardingStepperContext {
    setCompleted: (key: string, completed: boolean) => void;
}

export const OnboardingStepperContext = createContext<OnboardingStepperContext>({
    setCompleted: () => {}
});

const OnboardingStepper = ({onFinalStepComplete, paperProps, children}: OnboardingStepperProps) => {
    const [activeStep, setActiveStep] = useState(0);
    const [currentStepCompleted, setCurrentStepCompleted] = useState(false);
    const steps = React.Children.map(children, child => {
        if (!React.isValidElement(child)) return null;
        if (child.type !== OnboardingStep) return null;
        return child;
    }).filter(child => child !== null);

    const setStepCompleted = useCallback((key: string, completed: boolean) => {
        if (key !== steps[activeStep].props.step_key) return;
        setCurrentStepCompleted(completed);
    }, [activeStep, steps]);

    steps.forEach(step => {
        React.Children.forEach(step.props.children, child => {
            if (isValidElement(child) && child.props.setCompleted !== undefined) {
                console.warn("OnboardingStep: child of OnboardingStep must" +
                    " not have a setCompleted prop (it will be overwritten)");
            }
        });
    })

    const paperPropsWithDefaults = {
        ...paperProps,
        sx: {
            p: 2,
            elevation: 2,
            ...paperProps?.sx
        },
    };

    return (
        <Paper {...paperPropsWithDefaults}>
            <Stepper activeStep={activeStep} sx={{pb: 2}}>
                {steps.map((child, index) => {
                        return (
                            <Step key={index}>
                                <StepLabel>{child.props.label}</StepLabel>
                            </Step>
                        );
                    }
                )}
            </Stepper>
            <Box sx={{width: "100%", height: "100%"}}>
                <Paper variant={"outlined"} sx={{p: 2, mb: 2}}>
                    <OnboardingStepperContext.Provider value={{setCompleted: setStepCompleted}}>
                        {steps[activeStep]}
                    </OnboardingStepperContext.Provider>
                </Paper>
                <Stack direction={"row"} justifyContent={"end"}>
                    {activeStep === steps.length ?
                        <Button onClick={onFinalStepComplete} variant={"contained"}>Finish</Button>
                        :
                        <Button
                            disabled={!currentStepCompleted}
                            onClick={() => setActiveStep(currentStep => currentStep + 1)}
                            variant={"contained"}
                        >
                            Continue
                        </Button>
                    }
                </Stack>
            </Box>
        </Paper>
    );
};

export default OnboardingStepper;