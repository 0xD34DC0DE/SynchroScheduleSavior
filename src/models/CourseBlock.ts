import CourseId from "./CourseId.ts";
import CreditsRequirements from "./CreditsRequirements.ts";

class CourseBlock {
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly creditsRequirements: CreditsRequirements,
        public readonly coursesId: CourseId[],
    ) {
    }
}

export default CourseBlock;