import {Checkbox, FormControl, FormControlLabel, FormGroup, FormLabel, Stack} from "@mui/material";
import {CourseEntity} from "../../../models";
import {useEffect, useState} from "react";
import {useOutletContext} from "react-router-dom";
import {ScheduleViewerOutletContext} from "./ScheduleViewerOutlet.tsx";

interface SemesterCoursesPickerProps {
    courses: CourseEntity[];
}

const SemesterCoursesPicker = ({courses}: SemesterCoursesPickerProps) => {
    const [selectedCourses, setSelectedCourses] = useState<Record<string, boolean>>(
        Object.fromEntries(courses.map((course) => [course.id.toString(), true]))
    );
    const {setDisplayedCourses} = useOutletContext<ScheduleViewerOutletContext>();

    useEffect(() => {
        setDisplayedCourses(() => courses.filter((course) => selectedCourses[course.id.toString()]));
    }, [courses, selectedCourses]);

    return (
        <FormControl component={Stack} variant={"standard"} flex={1}>
            <FormLabel id={"semester-courses-picker-label"} sx={{pt: 1}}>Courses</FormLabel>
            <FormGroup sx={{pt: 0, overflowY: "auto", flex: "1 1 0", flexWrap: "nowrap"}}>
                {
                    courses
                        .sort((course1, course2) => course1.id.toString().localeCompare(course2.id.toString()))
                        .map((course) => {
                                const courseId = course.id.toString();
                                return <FormControlLabel
                                    key={courseId}
                                    control={
                                        <Checkbox
                                            checked={selectedCourses[courseId]}
                                            onChange={
                                                () => {
                                                    setSelectedCourses(prev => ({...prev, [courseId]: !prev[courseId]}));
                                                }
                                            }
                                        />
                                    }
                                    label={courseId}
                                />
                            }
                        )
                }
            </FormGroup>
        </FormControl>
    );
};

export default SemesterCoursesPicker;
