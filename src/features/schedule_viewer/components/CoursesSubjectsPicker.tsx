import {Box, Checkbox, FormControl, FormControlLabel, FormGroup, FormLabel, Paper} from "@mui/material";
import {type CourseId} from "../../../models";

interface CoursesSubjectsPickerProps {
    subjectsState: Record<CourseId["subject"], boolean>;
    onSubjectsChange?: (subjects: Record<CourseId["subject"], boolean>) => void;
}

const CoursesSubjectsPicker = ({subjectsState, onSubjectsChange}: CoursesSubjectsPickerProps) => {
    const handleToggle = (subject: CourseId["subject"]) => () => {
        onSubjectsChange?.({...subjectsState, [subject]: !subjectsState[subject]});
    };

    return (
        <Paper variant={"outlined"}>
            <Box p={1}>
                <FormControl>
                    <FormLabel sx={{pt: 1}}>Subjects</FormLabel>
                    <FormGroup>
                        {
                            Object.entries(subjectsState).map(([subject, state]) =>
                                <FormControlLabel
                                    key={subject}
                                    control={
                                        <Checkbox
                                            checked={state}
                                            size={"small"}
                                            onChange={handleToggle(subject)}
                                        />
                                    }
                                    label={subject}
                                />
                            )
                        }
                    </FormGroup>
                </FormControl>
            </Box>
        </Paper>
    );
};

export default CoursesSubjectsPicker;