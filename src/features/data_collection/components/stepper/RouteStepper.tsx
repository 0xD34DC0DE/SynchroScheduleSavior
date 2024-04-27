import {Outlet, useOutletContext, useParams} from "react-router-dom";
import useChildrenRoutes from "../../../../hooks/childrenRoutes.ts";
import {Dispatch, MutableRefObject, SetStateAction, useRef, useState} from "react";

type RouteStepperContextType = {
    isLastStep: boolean;
    nextPath: string;
    stepCompleteStateRef: MutableRefObject<[boolean, Dispatch<SetStateAction<boolean>>] | undefined>;
};

interface RouteStepperProps {
    onCompletionPath: string;
}

const RouteStepper = ({onCompletionPath}: RouteStepperProps) => {
    const activeStepPath = useParams()["*"];
    if (activeStepPath === undefined) throw new Error("Current path not found");

    const stepsRoute = useChildrenRoutes();
    if (stepsRoute.length === 0) throw new Error("Must have at least one step");

    const firstStepPath = stepsRoute[0].index === true ? "" : stepsRoute[0].path;
    if (firstStepPath === undefined) throw new Error("First step must have a path or be an index route");

    const stepsPath = [
        firstStepPath as string,
        ...stepsRoute.slice(1).map(route => {
            if (!route.path) throw new Error(`All steps after first one must have a path, ${route} does not have a path`);
            return route.path;
        })
    ];

    const activeStepIndex = stepsPath.indexOf(activeStepPath);
    if (activeStepIndex === -1) throw new Error(`Current path ${activeStepPath} not found in children paths`);

    const isLastStep = activeStepIndex === stepsPath.length - 1;
    const nextPath = isLastStep ? onCompletionPath : stepsPath[activeStepIndex + 1];
    const stepCompleteStateRef = useRef<Dispatch<SetStateAction<boolean>>>()

    return (<Outlet context={{isLastStep, nextPath, stepCompleteStateRef}}/>);
};

const useStepState = () => {
    const stepperContext = useOutletContext<RouteStepperContextType>();
    return {
        complete: stepperContext.stepCompleteStateRef.current?.[0] ?? false,
        isLastStep: stepperContext.isLastStep,
        nextPath: stepperContext.nextPath,
    };
}

const useSetStepState = () => {
    const stepCompleteState = useState(false);
    const stepperContext = useOutletContext<RouteStepperContextType>();
    stepperContext.stepCompleteStateRef.current = stepCompleteState;
    return stepperContext.stepCompleteStateRef.current[1];
}

export {useStepState, useSetStepState};
export default RouteStepper;
