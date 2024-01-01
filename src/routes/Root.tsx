import {CssBaseline} from "@mui/material";
import FlexBox from "../components/FlexBox.tsx";
import {Outlet, useNavigate} from "react-router-dom";
import useDataStore from "../stores/dataStore.ts";
import {useEffect} from "react";

export interface RootProps {
}

const Root = ({}: RootProps) => {
    const dataHasHydrated = useDataStore(state => state._hasHydrated);
    const navigate = useNavigate();

    useEffect(() => {
        if (dataHasHydrated) {
            navigate("/landing");
        }
    }, [dataHasHydrated]);

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