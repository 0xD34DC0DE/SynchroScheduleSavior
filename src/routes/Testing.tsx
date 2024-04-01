import {useEffect, useState} from "react";
import {InjectableWindow} from "../scraper";
import {Button, Stack} from "@mui/material";
import {WebScraper} from "../scraper/src/web_scraper.ts";
import {defaultContextFactory} from "../scraper/src/context.ts";
import {WebviewWindow} from "@tauri-apps/api/window";

export interface TestingProps {

}

const Testing = ({}: TestingProps) => {
    const [targetLabel, setTargetLabel] = useState<string | null>(null);
    const [windowOpen, setWindowOpen] = useState<boolean>(false);

    useEffect(() => {
        if (targetLabel === null || !windowOpen) return;
        let target = WebviewWindow.getByLabel(targetLabel);
        if (target === null) return;

        console.log("Starting injection");

        return new WebScraper(defaultContextFactory)
            .begin()
            .wait_for_url("*/NUI_FRAMEWORK.PT_LANDINGPAGE.GBL?")
            .task(
                () => console.log("TARGET: Page loaded"),
                [],
                (r) => console.log("INITIATOR: Page loaded, result: ", r)
            )
            .execute(target, () => {
                console.log("Task completed");
                setTargetLabel(null);
            });

    }, [targetLabel, windowOpen]);


    const createWindow = async () => {
        await InjectableWindow.create(
            "synchro",
            "Testing",
            "https://academique-dmz.synchro.umontreal.ca/"
        );
        setWindowOpen(true);
    }

    const startInjection = async () => {
        setTargetLabel("synchro");
    }

    return (
        <Stack direction={"column"}>
            <Button variant={"contained"} onClick={createWindow}>Open Window</Button>
            <Button variant={"contained"} onClick={startInjection} disabled={!windowOpen}>Inject</Button>
        </Stack>
    );
};

export default Testing;

//      .wait_page_load("*/NUI_FRAMEWORK.PT_LANDINGPAGE.GBL?") // -> Page
//      .navigate_to("/psc/acprpr9/EMPLOYEE/SA/c/SA_LEARNER_SERVICES.SSS_STUDENT_CENTER.GBL") // -> Navigation
//      .wait_page_load("*/SA_LEARNER_SERVICES.SSS_STUDENT_CENTER.GBL*") // -> Page
//      .click_link("#gh-container-footer-4059") // -> Navigation
//      .wait_page_load("*/SA_LEARNER_SERVICES_2.SSR_SSENRL_CART.GBL/*") // -> Page