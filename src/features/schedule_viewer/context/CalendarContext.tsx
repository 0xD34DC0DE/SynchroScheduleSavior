import {createContext, ReactNode, useContext, useState} from 'react';
import {DayOfWeekType, SemesterEntity} from "../../../models";
import CalendarSemester from "../models/CalendarSemester.ts";
import CalendarTimeBlock from "../models/CalendarTimeBlock.ts";
import {CourseAttributeFilter} from "../models/CourseAttributeFilter.ts";

interface CalendarContextProps {
    availableSemesters: SemesterEntity["term"][];
    displayedSemester: CalendarSemester;
    setDisplayedSemester: (semesterTerm: SemesterEntity["term"]) => void;
    addFilter: (filter: CourseAttributeFilter) => void;
    removeFilter: (filter: CourseAttributeFilter) => void;
    timeBlocksPerDay: Map<DayOfWeekType, CalendarTimeBlock[]>;
}

const CalendarContext = createContext<CalendarContextProps | undefined>(undefined);

interface CalendarProviderProps {
    children: ReactNode;
    semesters: SemesterEntity[];
}

const CalendarProvider = ({children, semesters}: CalendarProviderProps) => {
    const availableSemesters = semesters.map(semester => semester.term);
    const [contextDisplayedSemester, setContextDisplayedSemester] = useState<CalendarSemester>(new CalendarSemester(semesters[0]));
    const [timeBlocksPerDay, setTimeBlocksPerDay] = useState<Map<DayOfWeekType, CalendarTimeBlock[]>>(contextDisplayedSemester.timeBlocksPerDay());

    return (
        <CalendarContext.Provider
            value={{
                availableSemesters,
                displayedSemester: contextDisplayedSemester,
                setDisplayedSemester: (semesterTerm: SemesterEntity["term"]) => {
                    const semester = semesters.find(semester => semester.term === semesterTerm);
                    if (!semester) throw new Error(`Couldn't find semester ${semesterTerm}`);
                    setContextDisplayedSemester(new CalendarSemester(semester));
                },
                timeBlocksPerDay,
                addFilter: (filter: CourseAttributeFilter) => {
                    contextDisplayedSemester.addFilter(filter);
                    setTimeBlocksPerDay(contextDisplayedSemester.timeBlocksPerDay());
                },
                removeFilter: (filter: CourseAttributeFilter) => {
                    contextDisplayedSemester.removeFilter(filter);
                    setTimeBlocksPerDay(contextDisplayedSemester.timeBlocksPerDay());
                }
            }}
        >
            {children}
        </CalendarContext.Provider>
    );
}

const useCalendarContext = () => {
    const context = useContext(CalendarContext);
    if (!context) throw new Error('useCalendarContext must be used within a CalendarProvider');
    return context;
}


export {CalendarProvider, useCalendarContext};