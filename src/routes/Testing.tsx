import {Button, LinearProgress, Stack, Typography} from "@mui/material";
import {usePipelineState, useScraper} from "../components/ScraperProvider.tsx";
import {Link} from "react-router-dom";
import {PipelineState} from "../scraper/src/pipeline/task_pipeline.ts";
import login_modal_html from "../assets/login_modal.html?raw";
import {Context} from "../scraper/src/context.ts";

const show_login_modal = (ctx: Context, modal_html: string) => {
    const placeholder = document.createElement("div");
    placeholder.innerHTML = modal_html;
    document.body.appendChild(placeholder);
    const focus_button = document.getElementById("focus-main-window");
    if (!focus_button) throw new Error("Button not found");
    focus_button.onclick = async () => {
        await ctx.initiator.setFocus();
    };
}

export interface TestingProps {

}

const Testing = ({}: TestingProps) => {
    const [state, setState] = usePipelineState();
    const scraper = useScraper();

    const inject = () => {
        scraper
            .begin(setState)
            .wait_for_url("*/NUI_FRAMEWORK.PT_LANDINGPAGE.GBL?")
            .task_with_context(Context, show_login_modal, [login_modal_html])
            .wait_for_event("current", "tauri://focus")
            .execute();
    }

    return (
        <Stack direction={"column"} gap={2}>
            <Button variant={"contained"} onClick={inject}>Inject</Button>
            {state === PipelineState.RUNNING && <LinearProgress/>}
            {state === PipelineState.DONE && <Link to={"/"}>Done</Link>}
            <Typography>{state}</Typography>
        </Stack>
    );
};

export default Testing;

//      .wait_page_load("*/NUI_FRAMEWORK.PT_LANDINGPAGE.GBL?") // -> Page
//      .navigate_to("/psc/acprpr9/EMPLOYEE/SA/c/SA_LEARNER_SERVICES.SSS_STUDENT_CENTER.GBL") // -> Navigation
//      .wait_page_load("*/SA_LEARNER_SERVICES.SSS_STUDENT_CENTER.GBL*") // -> Page
//      .click_link("#gh-container-footer-4059") // -> Navigation
//      .wait_page_load("*/SA_LEARNER_SERVICES_2.SSR_SSENRL_CART.GBL/*") // -> Page