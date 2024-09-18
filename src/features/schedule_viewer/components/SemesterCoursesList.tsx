import {useAsyncValue, useSearchParams} from "react-router-dom";
import CoursesOptions from "./CoursesOptions.tsx";
import SemesterCoursesPicker from "./SemesterCoursesPicker.tsx";
import {CourseEntity, SemesterEntity} from "../../../models";
import {useState} from "react";

interface SemesterCoursesListProps {

}

const SemesterCoursesList = ({}: SemesterCoursesListProps) => {
    const [courseFilter, setCourseFilter] = useState<(course: CourseEntity) => boolean>(()=> () => true);
    const [searchParams] = useSearchParams();
    const semesters = useAsyncValue() as SemesterEntity[];

    const term = searchParams.get("term");
    if (!term) return null;

    const semester = semesters.find((semester) => semester.term === term);
    if (!semester) return null;

    const semesterCourses = Object.values(semester.courses);
    const filteredCourses = semesterCourses.filter(courseFilter);

    return (
        <>
            <CoursesOptions setCourseFilter={setCourseFilter}/>
            <SemesterCoursesPicker courses={filteredCourses}/>
        </>
    );
};

export default SemesterCoursesList;
