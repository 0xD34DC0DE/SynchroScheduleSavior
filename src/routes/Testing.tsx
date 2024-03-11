import {useEffect, useState} from "react";
import {InjectableWindow} from "../scraper";
import {Button, Stack} from "@mui/material";
import UrlPattern from "url-pattern";

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

        window.begin_sequence(async (sequence) => {
            console.log("Sequence started");
            await sequence
                .wait_page_load("*/NUI_FRAMEWORK.PT_LANDINGPAGE.GBL?") // -> Page
                .navigate_to("/psc/acprpr9/EMPLOYEE/SA/c/SA_LEARNER_SERVICES.SSS_STUDENT_CENTER.GBL") // -> Navigation
                .wait_page_load("*/SA_LEARNER_SERVICES.SSS_STUDENT_CENTER.GBL*") // -> Page
                .click_link("#gh-container-footer-4059") // -> Navigation
                .wait_page_load("*/SA_LEARNER_SERVICES_2.SSR_SSENRL_CART.GBL/*") // -> Page
                //dummy stuff VVV
                .click("#dummy") // -> Action
                .wait_element_load("#categoryOfDummies") // -> Condition
                .select_all("#dummies") // -> Selection
                .execute_subsequence(async (subsequence) => {
                    //...
                })
                .run();
                // Upon run, check for "Page" after Navigation to be
                // able to start the listener before the page loads
        });

        return () => {
            unlisten_nav.then(unlisten => unlisten());
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