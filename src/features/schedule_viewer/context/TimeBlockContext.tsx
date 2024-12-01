import {createContext, ReactNode, useCallback, useContext} from 'react';
import {TimeBlock} from "../models/TimeBlock.ts";

interface TimeBlockContextProps {
    getTopAndBottom: (timeBlock: TimeBlock) => {top: string, bottom: string};
}

const TimeBlockContext = createContext<TimeBlockContextProps | undefined>(undefined);

interface TimeBlockProviderProps {
    children: ReactNode;
    dayStartHour: number;
    dayEndHour: number;
}

const TimeBlockProvider = ({children, dayStartHour, dayEndHour}: TimeBlockProviderProps) => {
    const getTopAndBottom = useCallback((timeBlock: TimeBlock) => {
        const startMinutes = timeBlock.startTime.hour * 60 + timeBlock.startTime.minute;
        const endMinutes = timeBlock.endTime.hour * 60 + timeBlock.endTime.minute;
        const dayStart = dayStartHour * 60;
        const dayEnd = dayEndHour * 60;
        const totalMinutesInDay = dayEnd - dayStart;
        const top = ((startMinutes - dayStart) / totalMinutesInDay) * 100 + '%';
        const bottom = (100 - ((endMinutes - dayStart) / totalMinutesInDay) * 100) + '%';
        return {top, bottom};
    }, [dayStartHour, dayEndHour]);

    return (
        <TimeBlockContext.Provider value={{getTopAndBottom}}>
            {children}
        </TimeBlockContext.Provider>
    );
};

const useTimeBlockPosition = (timeBlock: TimeBlock): {
    top: string;
    bottom: string
}  => {
    const context = useContext(TimeBlockContext);
    if (!context) throw new Error('useTimeBlockPosition must be used within a TimeBlockProvider');
    return context.getTopAndBottom(timeBlock);
};

export {TimeBlockProvider, useTimeBlockPosition};