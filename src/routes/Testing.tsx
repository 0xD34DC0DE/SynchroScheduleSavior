import {Button, Stack, Typography} from "@mui/material";
import {useScraper} from "../components/ScraperProvider.tsx";
import {useState} from "react";
import {Link} from "react-router-dom";
import {PipelineState} from "../scraper/src/pipeline/task_pipeline.ts";
import test from "../assets/login_modal.html?raw";

export interface TestingProps {

}

const Testing = ({}: TestingProps) => {
    const [state, setState] = useState<PipelineState | null>(null);
    const scraper = useScraper();

    const inject = () => {
        scraper
            .begin()
            //.wait_for_url("*/NUI_FRAMEWORK.PT_LANDINGPAGE.GBL?")
            .task(
                (html: string) => {
                    const placeholder = document.createElement("div");
                    placeholder.innerHTML = html;
                    document.body.appendChild(placeholder);
                    const focus_button = document.getElementById("back-to-main-window");
                    if (!focus_button) throw new Error("Button not found");
                    focus_button.onclick = () => {
                        //TODO: Call event emitter
                    };
                },
                [test],
                (r) => {
                    if ("error" in r) {
                        console.error(r.error);
                    } else {
                        console.log("Task completed");
                    }
                }
            )
            .execute(() => {
                console.log("Injection completed");
            }, setState);
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