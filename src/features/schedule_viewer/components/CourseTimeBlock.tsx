import {Typography} from "@mui/material";
import Box from "@mui/material/Box";
import useHashColor from "../hooks/useHashColor.ts";
import useTextContrastColor from "../hooks/useTextConstrastColor.ts";
import {TimeBlock} from "../models/TimeBlock.ts";
import {useTimeBlockPosition} from "../context/TimeBlockContext.tsx";

interface CourseTimeBlockProps {
    timeBlock: TimeBlock;
}

const CourseTimeBlock = ({timeBlock}: CourseTimeBlockProps) => {
    const backgroundColor = useHashColor(timeBlock.courseId);
    const textColor = useTextContrastColor(backgroundColor);
    const {top, bottom} = useTimeBlockPosition(timeBlock);

    const startTime = `${timeBlock.startTime.hour}:${timeBlock.startTime.minute}`;
    const endTime = `${timeBlock.endTime.hour}:${timeBlock.endTime.minute}`;

    return (
        <Box
            bgcolor={backgroundColor}
            color={textColor}
            position={"absolute"}
            top={top}
            bottom={bottom}
            left={0}
            right={0}
        >
            <Typography variant="body1" p={0.5}>{timeBlock.courseName}: {startTime} - {endTime}</Typography>
            {/*{scheduleParam.map((param) => (*/}
            {/*    <Grid2 key={param.key}>*/}
            {/*        <Typography variant="body2" p={1}>{param.section?.id}</Typography>*/}
            {/*    </Grid2>*/}
            {/*))}*/}
        </Box>
    );
};

export default CourseTimeBlock;
