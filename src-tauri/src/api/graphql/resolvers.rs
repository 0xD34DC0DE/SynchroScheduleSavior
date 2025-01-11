use super::loaders::*;
use super::objects::*;
use super::utils::*;
use anyhow::anyhow;
use async_graphql::{ComplexObject, Context, Result as GraphQLResult};
use itertools::Itertools;

#[ComplexObject]
impl Semester {
    async fn credit_blocks(&self, ctx: &Context<'_>) -> GraphQLResult<Vec<CreditBlock>> {
        load_many_by_foreign_key::<SemesterId, CreditBlock, CreditBlockLoader>(
            ctx,
            self.id.clone(),
        )
        .await
    }

    async fn courses(&self, ctx: &Context<'_>) -> GraphQLResult<Vec<Course>> {
        load_many_by_foreign_key::<SemesterId, Course, CourseLoader>(ctx, self.id.clone())
            .await
    }
}

#[ComplexObject]
impl CreditBlock {
    async fn courses(&self, ctx: &Context<'_>) -> GraphQLResult<Vec<Course>> {
        load_many_by_foreign_key::<CreditBlockId, Course, CourseLoader>(
            ctx,
            self.id.clone(),
        )
        .await
    }
}

#[ComplexObject]
impl Course {
    /// The requirements to take the course.
    async fn requirements(&self, ctx: &Context<'_>) -> GraphQLResult<CourseRequirements> {
        load_one_by_foreign_key::<CourseId, CourseRequirements, CourseRequirementsLoader>(
            ctx,
            self.id.clone(),
        )
        .await
    }

    /// The list of main sections of the course.
    async fn sections(&self, ctx: &Context<'_>) -> GraphQLResult<Vec<MainSection>> {
        Ok(
            load_many_by_foreign_key::<CourseId, Section, SectionLoader>(
                ctx,
                self.id.clone(),
            )
            .await?
            .into_iter()
            .map(|section| match section {
                Section::MainSection(main_section) => main_section,
                Section::SubSection(_) => {
                    panic!("Got a subsection instead of a main section")
                }
            })
            .collect(),
        )
    }
}

#[ComplexObject]
impl MainSection {
    /// The list of time slots for the section.
    pub(super) async fn time_slots(
        &self,
        ctx: &Context<'_>,
    ) -> Result<Vec<TimeSlot>, anyhow::Error> {
        load_many_by_foreign_key::<SectionId, TimeSlot, TimeSlotLoader>(
            ctx,
            self.id.clone(),
        )
        .await
        .map_err(|e| anyhow!(e.message))
    }

    /// The list of schedule gaps for the section's time slots which simplifies
    /// the schedule of the section, by indicating when the section is not
    /// held instead of splitting the time slots to introduce gaps.
    pub(super) async fn schedule_gaps(
        &self,
        ctx: &Context<'_>,
    ) -> Result<Vec<ScheduleGap>, anyhow::Error> {
        load_many_by_foreign_key::<SectionId, ScheduleGap, ScheduleGapLoader>(
            ctx,
            self.id.clone(),
        )
        .await
        .map_err(|e| anyhow!(e.message))
    }

    /// The midterm exam of the section.
    async fn mid_term_exam(&self, ctx: &Context<'_>) -> GraphQLResult<Option<Exam>> {
        Ok(
            load_many_by_foreign_key::<SectionId, Exam, ExamLoader>(ctx, self.id.clone())
                .await?
                .into_iter()
                .find(|exam: &Exam| exam.is_of_type(ExamType::MidTerm)),
        )
    }

    /// The final exam of the section.
    async fn final_exam(&self, ctx: &Context<'_>) -> GraphQLResult<Option<Exam>> {
        Ok(
            load_many_by_foreign_key::<SectionId, Exam, ExamLoader>(ctx, self.id.clone())
                .await?
                .into_iter()
                .find(|exam: &Exam| exam.is_of_type(ExamType::Final)),
        )
    }

    /// The list of subsections associated with this main section.
    async fn sub_sections(
        &self,
        ctx: &Context<'_>,
    ) -> GraphQLResult<Vec<SectionTypeTuple>> {
        Ok(
            load_many_by_foreign_key::<MainSectionId, SubSection, SectionLoader>(
                ctx,
                self.id.clone().into(),
            )
            .await?
            .into_iter()
            .chunk_by(|sub_section| sub_section.section_type.clone())
            .into_iter()
            .map(|(section_type, sections)| SectionTypeTuple {
                _type: section_type,
                sections: sections.collect(),
            })
            .collect(),
        )
    }
}

#[ComplexObject]
impl SubSection {
    /// See [MainSection]
    pub(super) async fn time_slots(
        &self,
        ctx: &Context<'_>,
    ) -> Result<Vec<TimeSlot>, anyhow::Error> {
        load_many_by_foreign_key::<SectionId, TimeSlot, TimeSlotLoader>(
            ctx,
            self.id.clone(),
        )
        .await
        .map_err(|e| anyhow!(e.message))
    }

    /// See [MainSection]
    pub(super) async fn schedule_gaps(
        &self,
        ctx: &Context<'_>,
    ) -> Result<Vec<ScheduleGap>, anyhow::Error> {
        load_many_by_foreign_key::<SectionId, ScheduleGap, ScheduleGapLoader>(
            ctx,
            self.id.clone(),
        )
        .await
        .map_err(|e| anyhow!(e.message))
    }
}
