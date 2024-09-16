import * as animations from "./explanation_steps";

interface ExplanationAnimationProps {
    step: number;
}

const ExplanationAnimation = ({step}: ExplanationAnimationProps) => {
    return (
        [<animations.LoginExplanationAnimation/>][step]
    );
};

export default ExplanationAnimation;
