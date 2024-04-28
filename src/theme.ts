import {createTheme, responsiveFontSizes, ThemeOptions} from "@mui/material";

const theme = responsiveFontSizes(
    createTheme({
        palette: {
            background: {
                default: "#ffffff",
            }
        },
        typography: {

        },
        components: {
            MuiButton: {
                styleOverrides: {
                    root: {
                        textTransform: "none",
                    },
                },
            },
            MuiCardHeader: {
                styleOverrides: {
                    root: {
                        paddingBottom: "0.5rem",
                    },
                },
            },
            MuiCardContent: {
                styleOverrides: {
                    root: {
                        paddingTop: "0.5rem",
                    },
                },
            },
            MuiCardActions: {
                styleOverrides: {
                    root: {
                        marginTop: "1rem",
                    },
                },
            },
            MuiTooltip: {
                styleOverrides: {
                    tooltipArrow: {
                        background: "rgba(0, 0, 0, 0.8)",
                        backdropFilter: "blur(5px)",
                    },
                    arrow: {
                        color: "rgba(0, 0, 0, 0.8)",
                        backdropFilter: "blur(5px)",
                    },
                },
            },
        },
    } as ThemeOptions),
    {
        factor: 2,
    }
);

export default theme;