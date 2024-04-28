import {CssBaseline, ThemeProvider} from "@mui/material";
import {Outlet} from "react-router-dom";
import theme from "./theme.ts";

interface RootProps {
}

const Root = ({}: RootProps) => {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline>
                <Outlet/>
            </CssBaseline>
        </ThemeProvider>
    );
};

export default Root;