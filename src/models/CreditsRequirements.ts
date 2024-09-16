import {Entity} from "./types.ts";

interface CreditsRequirements {
    readonly requiredCredits: number;
    readonly obtainedCredits: number;
}

class CreditsRequirementsEntity implements CreditsRequirements, Entity {
    public readonly requiredCredits: number;
    public readonly obtainedCredits: number;

    constructor(input: CreditsRequirements) {
        this.requiredCredits = input.requiredCredits;
        this.obtainedCredits = input.obtainedCredits;
    }

    serialize() {
        return {
            requiredCredits: () => this.requiredCredits,
            obtainedCredits: () => this.obtainedCredits,
        };
    }

    public get remainingCredits(): number {
        return this.requiredCredits - this.obtainedCredits;
    }
}

export type {CreditsRequirements};
export default CreditsRequirementsEntity;