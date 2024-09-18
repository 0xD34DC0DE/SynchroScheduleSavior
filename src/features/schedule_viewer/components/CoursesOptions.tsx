import {Button, Grid2, Popover, Stack} from "@mui/material";
import React, {useState} from "react";
import {CourseEntity, type CourseId} from "../../../models";
import CoursesSubjectsPicker from "./CoursesSubjectsPicker.tsx";

interface CoursesOptionsProps {
    courses: CourseEntity[];
    onCoursesChange?: (courses: CourseEntity[]) => void;
}

const CoursesOptions = ({courses, onCoursesChange}: CoursesOptionsProps) => {
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const [selectedSubjects, setSelectedSubjects] = useState<Record<CourseId["subject"], boolean>>(initSubjects(courses));

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleSubjectsChange = (subjects: Record<CourseId["subject"], boolean>) => {
        const selectedCourses = courses.filter((course) => subjects[course.id.subject]);
        setSelectedSubjects(prev => ({...prev, ...subjects}));
        onCoursesChange?.(selectedCourses ?? []);
    }

    return (
        <>
            <Button variant={"contained"} onClick={handleClick}>Filter courses</Button>
            <Popover
                anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
                transformOrigin={{vertical: 'top', horizontal: 'center'}}
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={handleClose}
            >
                <Grid2 container p={2} m={1} spacing={1}>
                    <Grid2 size={6}>
                        <CoursesSubjectsPicker
                            subjectsState={selectedSubjects}
                            onSubjectsChange={handleSubjectsChange}
                        />
                    </Grid2>

                    <Grid2 container size={6}>
                        <Stack spacing={1}>
                            <Button variant={"contained"}>All</Button>
                            <Button variant={"contained"}>Selected</Button>
                        </Stack>
                    </Grid2>
                </Grid2>
            </Popover>

        </>
    );
};

export default CoursesOptions;

const initSubjects = (courses: CourseEntity[]): Record<CourseId["subject"], boolean> => {
    return courses.reduce((acc, course) => ({...acc, [course.id.subject]: true}), {});
};