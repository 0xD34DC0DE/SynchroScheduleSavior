import {ButtonProps} from "@mui/material/Button/Button";
import {alpha, Button, useTheme} from "@mui/material";
import {ReactNode} from "react";
import CheckIcon from "@mui/icons-material/Check";

export interface CompletableButtonProps extends ButtonProps {
    completed: boolean;
    successElement?: ReactNode;
    successIcon?: ReactNode;
    successColor?: string;
    children?: ReactNode;
}

const CompletableButton = ({
                               completed,
                               successElement,
                               successIcon,
                               successColor,
                               children,
                               ...buttonProps
                           }: CompletableButtonProps) => {
    const theme = useTheme();
    const buttonPropsWithDefaults = {
        ...buttonProps,
        sx: {
            ...(completed ? {
                backgroundColor: alpha(successColor ?? theme.palette.success.main, 0.6),
                pointerEvents: "none" as const,
            } : {}),
            ...buttonProps.sx
        },
        endIcon: completed && (successIcon ?? <CheckIcon/>),
    };

    return (
        <Button {...buttonPropsWithDefaults}>
            {completed ? (successElement ?? children) : children}
        </Button>
    );
};

export default CompletableButton;