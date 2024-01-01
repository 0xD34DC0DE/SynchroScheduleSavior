import {Button, Paper, Stack, Typography} from "@mui/material";
import useDataStore from "../stores/dataStore.ts";
import {useNavigate} from "react-router-dom";
import ConfirmButton from "../components/ConfirmButton.tsx";

export interface LandingPageProps {
}

const getText = (isDataEmpty: boolean) => {
    if (isDataEmpty) {
        return {
            title: "Let's get started!",
            remark: "Looks like there is no data collected yet.",
            instructions: "Click the button below to start collecting semester data."
        }
    } else {
        return {
            title: "Welcome back!",
            remark: "Looks like you have collected semester data previously.",
            instructions: "Choose whether you want to use the existing data or start fresh."
        }
    }
}

const LandingPage = ({}: LandingPageProps) => {
    const isDataEmpty = useDataStore(state => state.isEmpty);
    const clearData = useDataStore.persist.clearStorage;
    const navigate = useNavigate();

    return (
        <Paper sx={{p: 2, maxWidth: "75%"}} elevation={2}>
            <Stack spacing={.5}>
                <Typography variant={"h5"} sx={{pb: 1}}>
                    {getText(isDataEmpty()).title}
                </Typography>
                <Typography variant={"body1"}>
                    {getText(isDataEmpty()).remark}
                </Typography>
                <Typography variant={"body1"}>
                    {getText(isDataEmpty()).instructions}
                </Typography>
                <Stack direction={"row"} spacing={1} justifyContent={"center"} sx={{pt: 2}}>
                    {!isDataEmpty() &&
                        <>
                            <Button onClick={() => navigate("/dashboard")} variant={"contained"}>
                                Use Existing Data
                            </Button>
                            <ConfirmButton
                                onConfirm={() => {
                                    clearData();
                                    navigate("/data_collection");
                                }}
                                message={"Are you sure you want to start fresh and delete all existing data?"}
                                variant={"contained"}>
                                Start Fresh
                            </ConfirmButton>
                        </>
                    }
                    {isDataEmpty() &&
                        <Button onClick={() => navigate("/data_collection")} variant={"contained"}>
                            Collect data
                        </Button>
                    }
                </Stack>
            </Stack>
        </Paper>
    );
};

export default LandingPage;