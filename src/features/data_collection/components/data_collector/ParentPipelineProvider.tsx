import {
    Children,
    createContext,
    Dispatch,
    ReactNode, SetStateAction,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState
} from "react";
import {AsyncPipelineStepsBuilder, PipelineStepsBuilder, TaskPipeline} from "../../../../lib/webview_scraper";

interface ParentPipelineProviderProps<T extends TaskPipeline> {
    onStepsBuilderReady: Dispatch<SetStateAction<AsyncPipelineStepsBuilder<T> | undefined>>;
    children: ReactNode | ReactNode[];
}

const ParentPipelineProvider = <T extends TaskPipeline>(
    {children, onStepsBuilderReady}: ParentPipelineProviderProps<T>
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
        <ParentPipelineContext.Provider value={{registerStepBuilder, unregisterStepBuilder}}>
            {children}
        </ParentPipelineContext.Provider>
    );
};

type RegisteredStepBuilder<T extends TaskPipeline> = {
    builder: PipelineStepsBuilder<T>
    index: number;
}

type ParentPipelineContextType<T extends TaskPipeline> = {
    registerStepBuilder: (builder: PipelineStepsBuilder<T>) => number;
    unregisterStepBuilder: (index: number) => void;
}

const ParentPipelineContext = createContext<ParentPipelineContextType<any> | undefined>(undefined);

const useParentPipeline = <T extends TaskPipeline>(): ParentPipelineContextType<T> => {
    const context = useContext(ParentPipelineContext);
    if (!context) {
        throw new Error("useParentPipeline must be used within a ParentPipelineProvider");
    }
    return context;
}

export {useParentPipeline};
export default ParentPipelineProvider;
