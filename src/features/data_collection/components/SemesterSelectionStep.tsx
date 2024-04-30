import Step from "./stepper/Step.tsx";
import {CircularProgress, Grid, Stack, Typography} from "@mui/material";
import {useSetStepState, useStepData} from "./stepper/RouteStepper.tsx";
import Box from "@mui/material/Box";
import {useEffect, useState} from "react";
import {PipelineState, usePipelineState, useScraper} from "../../../lib/webview_scraper";
import SemesterSelector from "./SemesterSelector.tsx";

interface SemesterSelectionStepProps {

}

const SemesterSelectionStep = ({}: SemesterSelectionStepProps) => {
    const setStepCompleted = useSetStepState();
    const [_, setStepData] = useStepData<SemesterData>();
    const scraper = useScraper();
    const [pipelineState, setPipelineState] = usePipelineState();
    const [semestersData, setSemestersData] = useState<SemesterData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedSemesters, setSelectedSemesters] = useState<string[]>([]);

    useEffect(() => {
        setStepCompleted(selectedSemesters.length > 0);
        if (semestersData === null) return;
        const selectedSemestersData = semestersData.semesters.filter(s => selectedSemesters.includes(s.name));
        setStepData({
            url: semestersData.url,
            semesters: selectedSemestersData
        });
    }, [selectedSemesters, setStepCompleted]);

    useEffect(() => {
        return scraper
            .begin(setPipelineState)
            .navigate_to(
                "/psc/acprpr9/EMPLOYEE/SA/c/SA_LEARNER_SERVICES.SSS_STUDENT_CENTER.GBL",
                "*/SA_LEARNER_SERVICES.SSS_STUDENT_CENTER.GBL*"
            )
            .navigate_with_click(
                ".gh-container-footer > ul > li > a",
                "*/SA_LEARNER_SERVICES_2.SSR_SSENRL_CART.GBL*"
            )
            .task(getSemestersData(), [], (semesters) => {
                if ("error" in semesters) {
                    setError(semesters.error);
                } else {
                    setSemestersData(semesters.value);
                }
            })
            .execute();
    }, [scraper, setPipelineState, setSemestersData, setError]);

    return (
        <Grid item xs={8} sm={6} md={5} lg={4} xl={4}>
            <Step title={"Semester selection"}>
                <Stack spacing={2}>
                    <Typography variant={"body1"}>
                        Please select the semesters you would like to collect data for.
                    </Typography>
                    <Typography variant={"body1"}>
                        Please note that the more semesters you select, the longer the data collection process will
                        take.
                    </Typography>
                </Stack>
                <Box my={4} display={"flex"} flexDirection={"column"} alignItems={"center"}>
                    {pipelineState === PipelineState.RUNNING &&
                        <>
                            <Typography variant={"body2"}>Looking for available semesters</Typography>
                            <CircularProgress/>
                        </>
                    }
                    {pipelineState === PipelineState.DONE && semestersData !== null &&
                        <SemesterSelector
                            semesters={semestersData.semesters.map(s => s.name)}
                            setSelectedSemesters={setSelectedSemesters}
                        />
                    }
                    {pipelineState === PipelineState.DONE && error !== null &&
                        <>
                            <Typography variant={"body2"}>An error occurred while looking for semesters</Typography>
                            <Typography variant={"body2"} color={"error"}>{error}</Typography>
                        </>
                    }
                </Box>
            </Step>
        </Grid>
    );
};

type SemesterData = {
    url: string,
    semesters: { name: string, href: string }[]
}

const getSemestersData = () => {
    return () => {
        const semesters = document.querySelectorAll<HTMLLinkElement>(".gridformatter.gh-listview li a");
        if (semesters === null) throw new Error("Could not find semesters list");
        return {
            url: window.location.href,
            semesters: Array.from(semesters).map(a => {
                const name = a.querySelector<HTMLParagraphElement>(".ui-li-heading");
                if (name === null) throw new Error("Could not find semester name");
                return {
                    name: name.innerText,
                    href: a.href
                };
            })
        }
    };
}

export type {SemesterData};
export default SemesterSelectionStep;
