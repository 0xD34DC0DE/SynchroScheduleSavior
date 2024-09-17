import {useLiveQuery} from "dexie-react-hooks";
import {db} from "../../../utils";
import {Checkbox, FormControl, FormControlLabel, FormGroup, FormLabel, Stack} from "@mui/material";

interface SemesterCoursesPickerProps {
    term: string;
}

const SemesterCoursesPicker = ({term}: SemesterCoursesPickerProps) => {
    const semester = useLiveQuery(
        () => db.semesters.where("term").equals(term).first(),
        [term]
    );

    return (
        <FormControl component={Stack} variant={"standard"} flex={1}>
            <FormLabel id={"semester-courses-picker-label"} sx={{pt: 1}}>Courses</FormLabel>
            <FormGroup sx={{pt: 0, overflowY: "scroll", flex: "1 1 0", flexWrap: "nowrap"}}>
                {Object.entries(semester?.courses ?? {}).map(([courseId]) => (
                    <FormControlLabel
                        key={courseId}
                        control={<Checkbox checked={false} onChange={() => {}} name={courseId}/>}
                        label={courseId}
                    />
                ))}
            </FormGroup>
        </FormControl>
    );
};

export default SemesterCoursesPicker;
