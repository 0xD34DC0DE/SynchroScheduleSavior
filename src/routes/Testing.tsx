import {Button, Stack, Typography} from "@mui/material";
import {useScraper} from "../components/ScraperProvider.tsx";
import {useState} from "react";
import {Link} from "react-router-dom";
import {PipelineState} from "../scraper/src/pipeline/task_pipeline.ts";

export interface TestingProps {

}

const Testing = ({}: TestingProps) => {
    const [state, setState] = useState<PipelineState | null>(null);
    const scraper = useScraper();

    const inject = () => {
        scraper
            .begin()
            .wait_for_url("*/NUI_FRAMEWORK.PT_LANDINGPAGE.GBL?")
            .task(
                () => console.log("TARGET: Page loaded"),
                [],
                (r) => console.log("INITIATOR: Page loaded, result: ", r)
            )
            .execute(() => {console.log("Task completed");}, setState);
    }

    return (
        <Stack direction={"column"}>
            <Button variant={"contained"} onClick={inject}>Inject</Button>
            <Typography>{state}</Typography>
            <Link to={"/"}>Back to Root</Link>
            <Link to={"/test/second"}>Second</Link>
        </Stack>
    );
};

export default Testing;

//      .wait_page_load("*/NUI_FRAMEWORK.PT_LANDINGPAGE.GBL?") // -> Page
//      .navigate_to("/psc/acprpr9/EMPLOYEE/SA/c/SA_LEARNER_SERVICES.SSS_STUDENT_CENTER.GBL") // -> Navigation
//      .wait_page_load("*/SA_LEARNER_SERVICES.SSS_STUDENT_CENTER.GBL*") // -> Page
//      .click_link("#gh-container-footer-4059") // -> Navigation
//      .wait_page_load("*/SA_LEARNER_SERVICES_2.SSR_SSENRL_CART.GBL/*") // -> Page