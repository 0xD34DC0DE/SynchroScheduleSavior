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
                    .for_each<HTMLInputElement>(
                        "input[value^='Afficher']",
                        (button: HTMLElementProxy<HTMLInputElement>, sub_pipeline: SynchroPipelineExtension) =>
                            sub_pipeline
                                .click_and_wait_for_loader(button)
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

export default DataCollectorBlocksExpansionStep;
