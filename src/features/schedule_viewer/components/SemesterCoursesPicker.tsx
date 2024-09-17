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
        <FormControl component={Stack} variant={"standard"} sx={{ flexGrow: 1, overflowY: 'auto', height: '100%' }}>
            <FormLabel id={"semester-courses-picker-label"} sx={{pt: 1, pl: 1}}>Courses</FormLabel>
            <FormGroup sx={{p: 1, pt: 0}}>
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
