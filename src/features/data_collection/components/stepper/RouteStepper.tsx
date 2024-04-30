import {Outlet, useLocation, useOutletContext, useParams, useResolvedPath} from "react-router-dom";
import useSplatPathChildrenRoutes from "../../../../hooks/childrenRoutes.ts";
import {Dispatch, MutableRefObject, SetStateAction, useRef, useState} from "react";

type RouteStepperContextType = {
    isLastStep: boolean;
    nextPath: string;
    stepCompleteStateRef: MutableRefObject<[boolean, Dispatch<SetStateAction<boolean>>] | undefined>;
    stepDataStateRef: MutableRefObject<[any, Dispatch<SetStateAction<any>>] | undefined>;
};

interface RouteStepperProps {
    onCompletionPath: string;
}

const RouteStepper = ({onCompletionPath}: RouteStepperProps) => {
    const activeStepPath = useParams()["*"];
    if (activeStepPath === undefined) throw new Error("Current path not found");

    const stepsRoute = useSplatPathChildrenRoutes();
    if (stepsRoute.length === 0) return null;// throw new Error("Must have at least one step");

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
    const nextPath = useResolvedPath(`../${isLastStep ? onCompletionPath : stepsPath[activeStepIndex + 1]}`);
    const stepCompleteStateRef = useRef<Dispatch<SetStateAction<boolean>>>();
    const stepDataStateRef = useRef<Dispatch<SetStateAction<any>>>();

    return (<Outlet context={{isLastStep, nextPath, stepCompleteStateRef, stepDataStateRef}}/>);
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
    const {state: previousStepData} = useLocation();
    const stateDataState = useState<any>(previousStepData);
    const stepperContext = useOutletContext<RouteStepperContextType>();
    stepperContext.stepCompleteStateRef.current = stepCompleteState;
    stepperContext.stepDataStateRef.current = stateDataState;
    return stepperContext.stepCompleteStateRef.current[1];
}

const useStepData = <T,>(): [T, Dispatch<SetStateAction<T>>] => {
    const stepperContext = useOutletContext<RouteStepperContextType>();
    return stepperContext.stepDataStateRef.current as [T, Dispatch<SetStateAction<T>>];
}

export {useStepState, useSetStepState, useStepData};
export default RouteStepper;
