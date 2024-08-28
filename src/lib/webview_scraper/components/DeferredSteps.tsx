import {
    Children,
    createContext,
    Dispatch,
    ReactNode,
    SetStateAction,
    useCallback,
    useEffect,
    useRef,
    useState
} from "react";
import {AsyncPipelineStepsBuilder, PipelineStepsBuilder, TaskPipeline} from "../index.ts";
import DeferredStepsContextType from "../contexts/DeferredStepsContext.ts";

interface DeferredStepsProps<T extends TaskPipeline> {
    onStepsBuilderReady: Dispatch<SetStateAction<AsyncPipelineStepsBuilder<T> | undefined>>;
    children: ReactNode | ReactNode[];
}

const DeferredSteps = <T extends TaskPipeline>(
    {children, onStepsBuilderReady}: DeferredStepsProps<T>
) => {
    const childrenCount = Children.count(children);
    const [registeredStepBuilders, setRegisteredStepBuilders] = useState<RegisteredStepBuilder<T>[]>([]);
    const indexRef = useRef(0);

    const registerStepBuilder = useCallback((builder: PipelineStepsBuilder<T>) => {
        const index = indexRef.current++;
        setRegisteredStepBuilders(prevBuilders => [...prevBuilders, {builder, index}]);
        return index;
    }, []);

    const unregisterStepBuilder = useCallback((index: number) => {
        setRegisteredStepBuilders(prevBuilders => prevBuilders.filter(builder => builder.index !== index));
    }, []);

    useEffect(() => {
        if (registeredStepBuilders.length !== childrenCount) return;

        const stepsBuilder = async (pipeline: T) => registeredStepBuilders.reduce(
            (pipeline, {builder}) => builder(pipeline),
            pipeline
        );

        onStepsBuilderReady(() => stepsBuilder);
    }, [childrenCount, onStepsBuilderReady, registeredStepBuilders]);

    return (
        <DeferredStepsContext.Provider value={{registerStepBuilder, unregisterStepBuilder}}>
            {children}
        </DeferredStepsContext.Provider>
    );
};

type RegisteredStepBuilder<T extends TaskPipeline> = {
    builder: PipelineStepsBuilder<T>
    index: number;
}

const DeferredStepsContext = createContext<DeferredStepsContextType<any> | undefined>(undefined);

export {DeferredStepsContext};
export default DeferredSteps;
