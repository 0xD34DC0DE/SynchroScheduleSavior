import {CssBaseline} from "@mui/material";
import {Outlet} from "react-router-dom";

interface RootProps {
}

const Root = ({}: RootProps) => {
    return (
        <CssBaseline>
            <Outlet/>
        </CssBaseline>
    );
};

export default Root;