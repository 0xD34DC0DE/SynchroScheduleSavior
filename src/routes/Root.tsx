import {CssBaseline} from "@mui/material";
import FlexBox from "../components/FlexBox.tsx";
import {Outlet} from "react-router-dom";

export interface RootProps {
}

const Root = ({}: RootProps) => {
    return (
        <CssBaseline>
            <FlexBox sx={{width: "100%", height: "100%", backgroundColor: "rgb(255,247,240)"}}
                     horizontalAlignment={"center"} verticalAlignment={"center"}>
                <Outlet/>
            </FlexBox>
        </CssBaseline>
    );
};

export default Root;