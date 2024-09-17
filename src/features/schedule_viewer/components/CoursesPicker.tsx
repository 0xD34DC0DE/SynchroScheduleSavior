import {FormControl, InputLabel, MenuItem, Paper, Select, Stack} from "@mui/material";
import {useLiveQuery} from "dexie-react-hooks";
import {db} from "../../../utils";
import {useEffect, useState} from "react";
import SemesterCoursesPicker from "./SemesterCoursesPicker.tsx";

interface CoursesPickerProps {

}

const CoursesPicker = ({}: CoursesPickerProps) => {
    const semesters = useLiveQuery(() => db.semesters.toArray());
    const terms = semesters?.map((semester) => semester.term);
    const [selectedTerm, setSelectedTerm] = useState<string>("");

    useEffect(() => {
        setSelectedTerm(terms?.[0] ?? "");
    }, [terms]);

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
                    {terms?.map((term, i) => (
                        <MenuItem value={term} key={i}>{term}</MenuItem>
                    ))}
                </Select>
            </FormControl>
            <SemesterCoursesPicker term={selectedTerm}/>
        </Paper>
    );
};

export default CoursesPicker;
