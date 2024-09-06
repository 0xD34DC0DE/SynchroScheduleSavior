import {Grid, Stack, Typography} from "@mui/material";
import Step from "./stepper/Step.tsx";
import Box from "@mui/material/Box";
import {useSetStepState, useStepData} from "./stepper/RouteStepper.tsx";
import {AvailableSemesters} from "./SemesterSelectionStep.tsx";
import {SemesterDataCollector} from "./data_collector";
import {useRef, useState} from "react";
import {Course} from "./data_collector/types.ts";

interface SemestersDataCollectionStepProps {
}

const SemestersDataCollectionStep = ({}: SemestersDataCollectionStepProps) => {
    const setStepCompleted = useSetStepState();
    const [previousStepData, setStepData] = useStepData<AvailableSemesters, Course[]>();
    const [runningCollector, setRunningCollector] = useState(0);
    const collectedCourses = useRef<Course[]>([]);

    const onCourseCollected = (courses: Course[]) => {
        setRunningCollector(runningCollector + 1);
        collectedCourses.current = [...collectedCourses.current, ...courses];

        if (runningCollector + 1 === previousStepData.semesters.length) {
            setStepData(collectedCourses.current);
            setStepCompleted(true);
        }
    }

    return (
        <Grid item xs={8} sm={6} md={5}>
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
                        {previousStepData.semesters.map((semester, i) => (
                            <SemesterDataCollector
                                key={semester.name}
                                setCollectedCourses={onCourseCollected}
                                collectData={i === runningCollector}
                                semester={semester}
                                start_url={previousStepData.url}
                            />
                        ))}
                    </Grid>
                </Box>
            </Step>
        </Grid>
    );
};

export default SemestersDataCollectionStep;
