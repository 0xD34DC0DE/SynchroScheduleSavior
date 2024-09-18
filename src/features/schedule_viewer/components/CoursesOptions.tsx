import {Button, Grid2, Popover, Stack} from "@mui/material";
import React, {Dispatch, SetStateAction, useState} from "react";
import {CourseEntity, type CourseId, SemesterEntity} from "../../../models";
import CoursesSubjectsPicker from "./CoursesSubjectsPicker.tsx";
import {useAsyncValue, useSearchParams} from "react-router-dom";

interface CoursesOptionsProps {
    setCourseFilter: Dispatch<SetStateAction<(course: CourseEntity) => boolean>>;
}

const CoursesOptions = ({setCourseFilter}: CoursesOptionsProps) => {
    const [searchParams] = useSearchParams();

    const semesters = useAsyncValue() as SemesterEntity[];
    const semesterCourses = Object.values(
        semesters.find((semester) => semester.term === searchParams.get("term"))?.courses ?? {}
    );

    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const [selectedSubjects, setSelectedSubjects] = useState<Record<CourseId["subject"], boolean>>(initSubjects(semesterCourses));

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleSubjectsChange = (subjects: Record<CourseId["subject"], boolean>) => {
        setSelectedSubjects(prev => ({...prev, ...subjects}));
        setCourseFilter(() => (course: CourseEntity) => subjects[course.id.subject]);
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