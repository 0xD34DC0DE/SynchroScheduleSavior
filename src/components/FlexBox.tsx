import Box from '@mui/material/Box';
import {ReactNode} from "react";
import {SxProps} from "@mui/material";

export interface FlexBoxProps {
    direction?: 'row' | 'row-reverse' | 'column' | 'column-reverse';
    verticalAlignment?: 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch';
    horizontalAlignment?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
    wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
    grow?: number;
    shrink?: number;
    basis?: string;
    gap?: string;
    sx?: SxProps;
    children?: ReactNode | ReactNode[];
}

const FlexBox = ({
                     direction = 'row',
                     verticalAlignment = 'stretch',
                     horizontalAlignment = 'flex-start',
                     wrap = 'nowrap',
                     grow = 0,
                     shrink = 1,
                     basis = 'auto',
                     gap = '0',
                     sx,
                     children,
                 }: FlexBoxProps) => {
    const justifyContent = direction.startsWith('row') ? horizontalAlignment : verticalAlignment;
    const alignItems = direction.startsWith('row') ? verticalAlignment : horizontalAlignment;

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: direction,
                justifyContent,
                alignItems,
                flexWrap: wrap,
                flexGrow: grow,
                flexShrink: shrink,
                flexBasis: basis,
                gap,
                ...sx,
            }}
        >
            {children}
        </Box>
    );
};

export default FlexBox;