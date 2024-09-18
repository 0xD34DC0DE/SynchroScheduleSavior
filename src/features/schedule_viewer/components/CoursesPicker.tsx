import {FormControl, InputLabel, MenuItem, Paper, Select, Stack} from "@mui/material";
import {useAsyncValue, useSearchParams} from "react-router-dom";
import {SemesterEntity} from "../../../models";
import SemesterCoursesList from "./SemesterCoursesList.tsx";

interface CoursesPickerProps {

}

const CoursesPicker = ({}: CoursesPickerProps) => {
    const [searchParams, setSearchParams] = useSearchParams();

    const semesters = useAsyncValue() as SemesterEntity[];
    const availableTerms = semesters.map((semester) => semester.term);

    return (
        <Paper component={Stack} p={2} spacing={1} flex={1}>
            <FormControl fullWidth>
                <InputLabel id={"term-select-label"}>Term</InputLabel>
                <Select
                    labelId={"term-select-label"}
                    label={"Term"}
                    variant={"outlined"}
                    value={searchParams.get("term") ?? ""}
                    onChange={(e) => setSearchParams({"term": e.target.value})}
                >
                    {availableTerms.map((term, i) => (
                        <MenuItem value={term} key={i}>{term}</MenuItem>
                    ))}
                </Select>
            </FormControl>
            <SemesterCoursesList/>
        </Paper>
    );
};

export default CoursesPicker;
