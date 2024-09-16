import CourseIdEntity, {CourseId} from "./CourseId.ts";
import CreditsRequirementsEntity, {CreditsRequirements} from "./CreditsRequirements.ts";
import {IndexableEntity, serializeEntity} from "./types.ts";

interface CourseBlock {
    readonly id: string;
    readonly name: string;
    readonly creditsRequirements: CreditsRequirements;
    readonly coursesId: CourseId[];
}

class CourseBlockEntity implements CourseBlock, IndexableEntity<"id"> {
    public readonly id: string;
    public readonly name: string;
    public readonly creditsRequirements: CreditsRequirementsEntity;
    public readonly coursesId: CourseIdEntity[];

    constructor(input: CourseBlock) {
        this.id = input.id;
        this.name = input.name;
        this.creditsRequirements = new CreditsRequirementsEntity(input.creditsRequirements);
        this.coursesId = input.coursesId.map(courseId => new CourseIdEntity(courseId));
    }

    serialize(){
        return {
            id: () => this.id,
            name: () => this.name,
            creditsRequirements: () => serializeEntity(this.creditsRequirements),
            coursesId: () => this.coursesId.map(courseId => serializeEntity(courseId))
        };
    }
}

export type {CourseBlock};
export default CourseBlockEntity;