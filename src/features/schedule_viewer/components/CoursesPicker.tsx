import {FormControl, InputLabel, MenuItem, Paper, Select, Stack} from "@mui/material";
import {useEffect, useState} from "react";
import SemesterCoursesPicker from "./SemesterCoursesPicker.tsx";
import CoursesOptions from "./CoursesOptions.tsx";
import {useAsyncValue} from "react-router-dom";
import {SemesterEntity} from "../../../models";

interface CoursesPickerProps {

}

const CoursesPicker = ({}: CoursesPickerProps) => {
    const semesters = useAsyncValue() as SemesterEntity[];

    const availableTerms = semesters.map((semester) => semester.term);
    const [selectedTerm, setSelectedTerm] = useState<string>(availableTerms?.[0] ?? "");

    const selectedSemester = semesters?.find((semester) => semester.term === availableTerms?.[0]);

    const courses = Object.values(selectedSemester?.courses ?? {});
    const [filteredCourses, setFilteredCourses] = useState(courses);

    useEffect(() => {
        setSelectedTerm(availableTerms?.[0] ?? "");
    }, [availableTerms]);

    return (
        <Paper component={Stack} p={2} spacing={1} flex={1}>
            <FormControl fullWidth>
                <InputLabel id={"term-select-label"}>Term</InputLabel>
                <Select
                    labelId={"term-select-label"}
                    label={"Term"}
                    variant={"outlined"}
                    value={selectedTerm}
                    onChange={(e) => setSelectedTerm(e.target.value)}
                >
                    {availableTerms?.map((term, i) => (
                        <MenuItem value={term} key={i}>{term}</MenuItem>
                    ))}
                </Select>
            </FormControl>
            <CoursesOptions courses={courses} onCoursesChange={setFilteredCourses}/>
            <SemesterCoursesPicker courses={filteredCourses}/>
        </Paper>
    );
};

export default CoursesPicker;
