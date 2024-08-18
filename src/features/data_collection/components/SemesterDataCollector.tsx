import {CircularProgress, Grid, Typography} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from '@mui/icons-material/Error';
import PendingIcon from '@mui/icons-material/Pending';
import {useEffect, useState} from "react";
import {Selector, usePipelineState, useScraper} from "../../../lib/webview_scraper";

interface SemesterDataCollectorProps {
    setCollectedData: (data: any) => void;
    collectData: boolean;
    start_url: string;
    semester: { name: string, href: string };
}

const SemesterDataCollector = ({setCollectedData, collectData, start_url, semester}: SemesterDataCollectorProps) => {
    const [state, setState] = useState<SemesterDataCollectorState>("idle");
    const [foundCourses, setFoundCourses] = useState<string[]>([]);
    const [coursesData, setCoursesData] = useState<any[]>([]);
    const scraper = useScraper();
    const [pipelineState, setPipelineState] = usePipelineState();

    useEffect(() => {
        if (!collectData) return;
        if (state !== "idle") return;
        setState("enumerating");

        return scraper
            .begin(setPipelineState)
            .navigate_to(start_url, /ExactKeys/)
            .navigate_to(semester.href, "*/SA_LEARNER_SERVICES_2.SSR_SSENRL_CART.GBL*")
            .click_and_wait(
                "input#DERIVED_REGFRM1_SSR_PB_SRCH",
                mutation => {
                    return (mutation.oldValue?.includes("show") &&
                        !(mutation.target as HTMLElement).classList.contains("show")) ?? false;
                },
                {
                    selector: new Selector("div.gh-loader-popup"),
                    observer_config: {attributes: true, attributeFilter: ['class'], attributeOldValue: true}
                }
            )
            .for_each<HTMLInputElement>(
                "input[value^='Afficher']",
                (button, sub_pipeline) =>
                    sub_pipeline.click_and_wait(
                        button,
                        mutation => {
                            return (mutation.oldValue?.includes("show") &&
                                !(mutation.target as HTMLElement).classList.contains("show")) ?? false;
                        },
                        {
                            selector: new Selector("div.gh-loader-popup"),
                            observer_config: {attributes: true, attributeFilter: ['class'], attributeOldValue: true}
                        }
                    )
            )
            .execute(() => {
                console.log("done");
            });
    }, [undefined, collectData]);

    return (
        <Grid
            container
            item
            justifyContent={"space-between"}
            px={1}
            xs={12}
            borderRadius={3}
            border={"1px solid rgba(0, 0, 0, 0.12)"}
            py={1}
            sx={{
                ":not(:last-child)": {
                    mb: 1
                },
            }}
        >
            <Grid item xs={3} display={"flex"} justifyContent={"center"} alignItems={"center"}>
                <Typography variant={"h5"}>{semester.name}</Typography>
            </Grid>
            <Grid item display={"flex"} justifyContent={"center"} alignItems={"center"}>
                {state === "done" && <Typography variant={"body2"}>Data collection done</Typography>}
                {state === "idle" && <Typography variant={"body2"}>Waiting...</Typography>}
                {state === "enumerating" && <Typography variant={"body2"}>Searching available courses...</Typography>}
                {state === "collecting" &&
                    <Typography variant={"body2"}>
                        Collecting course information: {coursesData.length} done out of {foundCourses.length}
                    </Typography>
                }
            </Grid>
            <Grid item xs={1} display={"flex"} justifyContent={"center"} alignItems={"center"}>
                {state === "done" && <CheckCircleIcon color={"success"}/>}
                {state === "idle" && <PendingIcon/>}
                {(state === "enumerating" || state === "collecting") && <CircularProgress size={20}/>}
                {state === "error" && <ErrorIcon color={"error"}/>}
            </Grid>
        </Grid>
    );
};

export default SemesterDataCollector;

type SemesterDataCollectorState = "idle" | "enumerating" | "collecting" | "done" | "error";
