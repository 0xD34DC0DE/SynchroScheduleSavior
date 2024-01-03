import {OnboardingStepContentProps} from "./OnboardingStep.tsx";
import {Stack, Typography} from "@mui/material";
import Box from "@mui/material/Box";
import {useEffect, useState} from "react";
import {useScraperStore} from "../stores/ScraperStore.ts";
import Semester from "../models/Semester.ts";
import {
    clickOnElementAndWaitForNavigation,
    getAvailableSemesters,
    navigateToStudentCenter
} from "../utils/syncho_utils.ts";
import UrlPattern from "url-pattern";

export interface SemesterSelectionStepProps extends OnboardingStepContentProps {

}

const SemesterSelectionStep = ({setCompleted}: SemesterSelectionStepProps) => {
    const scraper = useScraperStore(state => state.scraper);
    const [availableSemesters, setAvailableSemesters] = useState<Semester[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [cancel, setCancel] = useState<(() => void) | null>(null);

    useEffect(() => {
        if (!scraper){
            setCompleted?.(false);
        }
    }, [scraper, setCompleted]);

    useEffect(() => {
        if (!scraper || cancel !== null) return;
        if (availableSemesters.length > 0) return;
        console.log("Navigating to student center");
        const nav = navigateToStudentCenter(scraper);
        setCancel(nav.cancel);

        nav.promise
            .then(() => {
                console.log("Clicking on cart");
                const click = clickOnElementAndWaitForNavigation(
                    scraper,
                    "#gh-container-footer-4059",
                    new UrlPattern("*/SA_LEARNER_SERVICES_2.SSR_SSENRL_CART.GBL/*"),
                    1000
                );
                setCancel(click.cancel);
                console.log("Navigated to academics");
                click.promise.then(() => console.log("clicked"));
            })
            .then(async () => await getAvailableSemesters(scraper))
            .then(semesters => {
                if (semesters.length === 0) {
                    setError("No semesters available");
                } else {
                    setAvailableSemesters(semesters);
                }
            })
            .catch(e => {
                if(e !== "cancelled") {
                    setError(e.message);
                    console.error(e);
                }
            });

        return cancel ?? (() => {});
    }, [scraper, cancel]);

    return (
        <Box>
            <Typography variant={"h6"} textAlign={"center"}>
                Select the semesters you want to collect data for.
            </Typography>

            <Stack direction={"column"} sx={{pt: 1}}>
                {(availableSemesters.length === 0 && !error) && <Typography variant={"body1"}>Loading...</Typography>}
                {error && <Typography variant={"body1"} color={"error"}>Error: {error}</Typography>}
                {availableSemesters.map((semester, i) => (
                    <Typography variant={"body1"} key={i}>
                        {semester.term}
                    </Typography>
                ))}
            </Stack>
        </Box>
    );
};

export default SemesterSelectionStep;