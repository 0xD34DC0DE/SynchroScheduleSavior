import DataCollectorStep from "./DataCollectorStep.tsx";
import SemesterDataCollectorStatus from "./SemesterDataCollectorStatus.tsx";
import {HTMLElementProxy} from "../../../../lib/webview_scraper";
import {SynchroPipelineExtension} from "../../utils";
import {useState} from "react";

interface DataCollectorBlocksExpansionStepProps {
}

const DataCollectorBlocksExpansionStep = ({}: DataCollectorBlocksExpansionStepProps) => {
    const [expandedCoursesBlocksCount, setExpandedCoursesBlocksCount] = useState<number>(0);

    return (
        <DataCollectorStep
            pipelineSteps={
                (pipeline) => pipeline
                    .set_pipeline_name("BlocksExpansionStep")
                    .for_each<HTMLInputElement>(
                        "input[value^='Afficher']",
                        (button: HTMLElementProxy<HTMLInputElement>, sub_pipeline: SynchroPipelineExtension) =>
                            sub_pipeline
                                .set_pipeline_name("ForEachBlockExpansion")
                                .click_and_wait_for_loader(button)
                                .if_element_exists(
                                    expandAllButtonSelector,
                                    (button: HTMLElementProxy<HTMLLinkElement>, sub_pipeline: SynchroPipelineExtension) =>
                                        sub_pipeline
                                            .set_pipeline_name("ExpandAllButton")
                                            .click_and_wait_for_loader(button)
                                )
                                .callback(() => setExpandedCoursesBlocksCount(count => count + 1))
                    )
            }
        >
            <SemesterDataCollectorStatus
                description={"Expanding courses blocks"}
                status={`Expanded ${expandedCoursesBlocksCount} blocks`}
            />
        </DataCollectorStep>
    );
};

const expandAllButtonSelector =
    "div[id^=gh-table-pager-COURSE_LIST\\$scroll\\$] > div.gh-table-pager-more > ul > li:nth-child(2):nth-last-child(2) > a";

export default DataCollectorBlocksExpansionStep;
