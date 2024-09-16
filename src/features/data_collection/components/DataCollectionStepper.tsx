import RouteStepper from "./stepper/RouteStepper.tsx";
import {Grid} from "@mui/material";

interface DataCollectionStepperProps {
    onCompletionPath: string;
}

const DataCollectionStepper = ({onCompletionPath}: DataCollectionStepperProps) => {
    return (
        <Grid container item xs={12} display="flex" justifyContent={"center"}>
            <RouteStepper onCompletionPath={onCompletionPath}/>
        </Grid>
)
    ;
};

export default DataCollectionStepper;
