class CreditsRequirements {
    constructor(
        public readonly requiredCredits: number,
        public readonly obtainedCredits: number,
    ) {
    }

    public get remainingCredits(): number {
        return this.requiredCredits - this.obtainedCredits;
    }
}

export default CreditsRequirements;