import {useEffect, useState} from "react";
import {InjectableWindow} from "../scraper";
import {Button, Stack} from "@mui/material";
import {WebScrapper} from "../scraper/src/web_scraper.ts";
import {defaultContextFactory} from "../scraper/src/context.ts";

export interface TestingProps {

}

const Testing = ({}: TestingProps) => {
    const [window, setWindow] = useState<InjectableWindow | null>(null);

    useEffect(() => {
        if (!window) return;

        const unlisten_close = window.on_close(() => {
            console.log("Window closed");
            setWindow(null);
        });

        const cancel = new WebScrapper(window, defaultContextFactory)
            .begin()
            .wait_for_url("*/NUI_FRAMEWORK.PT_LANDINGPAGE.GBL?")
            .task(
                () => console.log("TARGET: Page loaded"),
                [],
                (r) => console.log("INITIATOR: Page loaded, result: ", r)
            )
            .execute();


        return () => {
            console.log("Cleaning up");
            cancel();
            unlisten_close.then(unlisten => unlisten());
        };
    }, [window]);

    return (
        <Stack direction={"column"}>
            <Button
                variant={"contained"}
                onClick={async () => {
                    setWindow(await InjectableWindow.create("synchro", "Testing", "https://academique-dmz.synchro.umontreal.ca/"));
                }}>Open Window</Button>
        </Stack>
    );
};

export default Testing;

//      .wait_page_load("*/NUI_FRAMEWORK.PT_LANDINGPAGE.GBL?") // -> Page
//      .navigate_to("/psc/acprpr9/EMPLOYEE/SA/c/SA_LEARNER_SERVICES.SSS_STUDENT_CENTER.GBL") // -> Navigation
//      .wait_page_load("*/SA_LEARNER_SERVICES.SSS_STUDENT_CENTER.GBL*") // -> Page
//      .click_link("#gh-container-footer-4059") // -> Navigation
//      .wait_page_load("*/SA_LEARNER_SERVICES_2.SSR_SSENRL_CART.GBL/*") // -> Page