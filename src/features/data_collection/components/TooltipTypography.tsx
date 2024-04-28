import {Tooltip, tooltipClasses, TooltipProps, Typography, TypographyProps} from "@mui/material";
import {OmitWithPrefix} from "../../../utils/type_utils.ts";

interface TooltipTypographyProps extends Omit<TooltipProps, 'children' | 'classes' | 'color' | 'component'>,
    Omit<OmitWithPrefix<'on', TypographyProps>, 'title' | 'ref'> {
    underline?: boolean;
    maxWidth?: number;
}

const TooltipTypography = (props: TooltipTypographyProps) => {
    const {
        sx,
        children,
        title,
        color,
        classes,
        ref,
        component,
        underline,
        ...rest
    } = props;

    return (
        <Tooltip
            title={<Typography>{title}</Typography>}
            arrow={props.arrow ?? true}
            placement={props.placement ?? "top"}
            {...{
                slotProps: {
                    popper: {
                        sx: {
                            [`&.${tooltipClasses.popper}[data-popper-placement*="top"] .${tooltipClasses.tooltip}`]: {
                                marginBottom: '0.5em'
                            }
                        }
                    },
                    tooltip: {
                        sx: {
                            [`&.${tooltipClasses.tooltip}`]: {
                                maxWidth: props.maxWidth
                            }
                        }
                    },
                    ...props.slotProps
                }
            }}
            {...{ref, ...rest}}
        >
            <Typography {...{
                sx: {
                    ...sx,
                    textDecoration: underline ? "underline" : "none",
                    cursor: "help"
                },
                children,
                color,
                classes,
                component,
                ...rest
            }}
            />
        </Tooltip>
    );
};

export default TooltipTypography;
