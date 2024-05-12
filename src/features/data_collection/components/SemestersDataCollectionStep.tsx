import {Grid, Stack, Typography} from "@mui/material";
import Step from "./stepper/Step.tsx";
import Box from "@mui/material/Box";
import {useSetStepState, useStepData} from "./stepper/RouteStepper.tsx";
import {SemesterData} from "./SemesterSelectionStep.tsx";
import SemesterDataCollector from "./SemesterDataCollector.tsx";
import {useState} from "react";

interface SemestersDataCollectionStepProps {

}

const SemestersDataCollectionStep = ({}: SemestersDataCollectionStepProps) => {
    const setStepCompleted = useSetStepState();
    const [previousStepData, _] = useStepData<SemesterData>();
    const [runningCollector, setRunningCollector] = useState(previousStepData.semesters[0]);

    return (
        <Grid item xs={8} sm={6} md={5} lg={4} xl={4}>
            <Step title={"Semester data collection"}>
                <Stack spacing={2}>
                    <Typography variant={"body1"}>
                        Please wait while the tool collects data for the selected semesters.
                    </Typography>
                    <Typography variant={"body1"}>
                        <strong>Do not close or interact</strong> with the tool window while data is being collected.
                    </Typography>
                </Stack>
                <Box my={4} display={"flex"} flexDirection={"column"} alignItems={"center"}>
                    <Grid container justifyContent={"center"}>
                        {previousStepData.semesters.map(semester => (
                            <SemesterDataCollector
                                key={semester.name}
                                setCollectedData={() => {

                                }}
                                collectData={runningCollector.name === semester.name}
                                semester={semester}
                            />
                        ))}
                    </Grid>
                </Box>
            </Step>
        </Grid>
    );
};

export default SemestersDataCollectionStep;
