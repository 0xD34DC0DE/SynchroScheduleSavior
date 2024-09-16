import {Box, keyframes, Typography, TypographyProps} from "@mui/material";

const ellipsisAnimation = keyframes`
    0% {
        clip-path: inset(0 0 0 0);
    }
    33% {
        clip-path: inset(0 66.6% 0 0);
    }
    66% {
        clip-path: inset(0 33.3% 0 0);
    }
    100% {
        clip-path: inset(0 0 0 0);
    }
`;

interface AnimatedEllipsisProps extends Omit<TypographyProps, "component"> {
    interval?: number;
}

const AnimatedEllipsis = ({interval, children, sx, ...typographyProps}: AnimatedEllipsisProps) => {
    return (
        <Typography {...typographyProps} sx={{display: "inline-flex", ...sx}}>
            {children}
            <Box
                component="span"
                sx={{
                    display: "inline-block",
                    width: "1em", // This ensures the width remains constant
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    "::after": {
                        content: '"..."',
                        animation: `${ellipsisAnimation} ${(interval ?? 1.5)}s steps(1) infinite`,
                    },
                }}
            />
        </Typography>
    );
};

export default AnimatedEllipsis;