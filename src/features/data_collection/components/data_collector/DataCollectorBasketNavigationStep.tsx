import SemesterDataCollectorStatus from "./SemesterDataCollectorStatus.tsx";
import DataCollectorStep from "./DataCollectorStep.tsx";

interface DataCollectorBasketNavigationStepProps {
    startUrl: string;
    semesterHref: string;
}

const DataCollectorBasketNavigationStep = ({startUrl, semesterHref}: DataCollectorBasketNavigationStepProps) => {
    return (
        <DataCollectorStep
            pipelineSteps={
                (pipeline) => pipeline
                    .set_pipeline_name("BasketNavigationStep")
                    .navigate_to(startUrl, /ExactKeys/)
                    .navigate_to(semesterHref, "*/SA_LEARNER_SERVICES_2.SSR_SSENRL_CART.GBL*")
                    .click_and_wait_for_loader("input#DERIVED_REGFRM1_SSR_PB_SRCH")
            }
        >
            <SemesterDataCollectorStatus
                description={"Navigating to courses basket"}
                status={"Navigating"}
            />
        </DataCollectorStep>
    );
};

export default DataCollectorBasketNavigationStep;
