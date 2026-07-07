import { prisma } from "../config/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import type {
  CreateSurveyInput,
  UpdateSurveyInput,
  UpdateStatusInput,
  ListSurveysQuery,
  DraftSurveyInput,
} from "../validators/survey.validator.js";

// ─── List Surveys ────────────────────────────────────────
export const listSurveys = async (userId: string, query: ListSurveysQuery) => {
  const { status, category, search, page, limit, sort_by, order } = query;

  const where: Record<string, unknown> = { creatorId: userId };

  if (status) where["status"] = status;
  if (category) where["category"] = category;
  if (search) {
    where["title"] = { contains: search };
  }

  const sortField = sort_by === "created_at" ? "createdAt" : sort_by === "title" ? "title" : "status";

  const [data, total] = await Promise.all([
    prisma.survey.findMany({
      where,
      orderBy: { [sortField]: order },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: { select: { responses: true, sections: true } },
        responses: {
          select: {
            timeTakenSec: true,
            completedAt: true,
          },
        },
        sections: {
          select: {
            _count: { select: { questions: true } },
          },
        },
      },
    }),
    prisma.survey.count({ where }),
  ]);

  return {
    data: data.map((survey) => {
      const completedResponses = survey.responses.filter((r) => r.completedAt !== null);
      const totalResponses = survey.responses.length;
      const completionRate =
        totalResponses > 0
          ? parseFloat(((completedResponses.length / totalResponses) * 100).toFixed(1))
          : 0;

      const times = survey.responses
        .filter((r) => r.timeTakenSec !== null)
        .map((r) => r.timeTakenSec!);
      const avgResponseTime =
        times.length > 0
          ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
          : 0;

      const questionCount = survey.sections.reduce(
        (sum, section) => sum + section._count.questions,
        0
      );

      return {
        id: survey.id,
        title: survey.title,
        description: survey.description,
        status: survey.status,
        category: survey.category,
        response_count: survey._count.responses,
        section_count: survey._count.sections,
        question_count: questionCount,
        avg_response_time: avgResponseTime,
        completion_rate: completionRate,
        created_at: survey.createdAt.toISOString(),
        updated_at: survey.updatedAt.toISOString(),
      };
    }),
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  };
};

// ─── Create Survey ───────────────────────────────────────
export const createSurvey = async (userId: string, input: CreateSurveyInput) => {
  const survey = await prisma.survey.create({
    data: {
      creatorId: userId,
      title: input.title,
      description: input.description,
      category: input.category,
      targetAudience: input.audience,
      goal: input.goal,
      usage: input.usage,
      status: (() => {
        if (!input.startDate) return "active";
        const start = new Date(input.startDate);
        return start > new Date() ? "inactive" : "active";
      })(),
      responseLimit: input.responseLimit,
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
      sections: {
        create: input.sections.map((section, sIdx) => ({
          title: section.title,
          sortOrder: sIdx,
          questions: {
            create: section.questions.map((question, qIdx) => ({
              text: question.text,
              type: question.type,
              required: question.required ?? true,
              sortOrder: qIdx,
              options: question.options
                ? {
                    create: question.options.map((opt, oIdx) => ({
                      value: opt.value,
                      sortOrder: oIdx,
                    })),
                  }
                : undefined,
            })),
          },
        })),
      },
    },
    include: {
      sections: {
        include: {
          questions: {
            include: { options: { orderBy: { sortOrder: "asc" } } },
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return survey;
};

// ─── Get Survey Detail ───────────────────────────────────
export const getSurveyDetail = async (surveyId: string, userId: string) => {
  const survey = await prisma.survey.findFirst({
    where: { id: surveyId, creatorId: userId },
    include: {
      sections: {
        include: {
          questions: {
            include: {
              options: { orderBy: { sortOrder: "asc" } },
            },
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!survey) throw new AppError("Survey not found", 404);

  return survey;
};

// ─── Update Survey ───────────────────────────────────────
export const updateSurvey = async (
  surveyId: string,
  userId: string,
  input: UpdateSurveyInput
) => {
  const existing = await prisma.survey.findFirst({
    where: { id: surveyId, creatorId: userId },
  });
  if (!existing) throw new AppError("Survey not found", 404);

  const survey = await prisma.survey.update({
    where: { id: surveyId },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.target_audience !== undefined && { targetAudience: input.target_audience }),
      ...(input.goal !== undefined && { goal: input.goal }),
      ...(input.usage !== undefined && { usage: input.usage }),
      ...(input.response_limit !== undefined && { responseLimit: input.response_limit }),
      ...(input.start_date !== undefined && { startDate: new Date(input.start_date) }),
      ...(input.end_date !== undefined && { endDate: new Date(input.end_date) }),
    },
  });

  return survey;
};

// ─── Delete Survey ───────────────────────────────────────
export const deleteSurvey = async (surveyId: string, userId: string) => {
  const existing = await prisma.survey.findFirst({
    where: { id: surveyId, creatorId: userId },
  });
  if (!existing) throw new AppError("Survey not found", 404);

  await prisma.survey.delete({ where: { id: surveyId } });
};

// ─── Update Status ───────────────────────────────────────
export const updateStatus = async (
  surveyId: string,
  userId: string,
  input: UpdateStatusInput
) => {
  const existing = await prisma.survey.findFirst({
    where: { id: surveyId, creatorId: userId },
  });
  if (!existing) throw new AppError("Survey not found", 404);

  const survey = await prisma.survey.update({
    where: { id: surveyId },
    data: { status: input.status },
  });

  return survey;
};

// ─── Duplicate Survey ────────────────────────────────────
export const duplicateSurvey = async (surveyId: string, userId: string) => {
  const existing = await prisma.survey.findFirst({
    where: { id: surveyId, creatorId: userId },
    include: {
      sections: {
        include: {
          questions: {
            include: {
              options: true,
            },
          },
        },
      },
    },
  });
  if (!existing) throw new AppError("Survey not found", 404);

  const newSurvey = await prisma.survey.create({
    data: {
      creatorId: userId,
      title: `${existing.title} (Copy)`,
      description: existing.description,
      category: existing.category,
      targetAudience: existing.targetAudience,
      goal: existing.goal,
      usage: existing.usage,
      status: "draft",
      responseLimit: existing.responseLimit,
      startDate: existing.startDate,
      endDate: existing.endDate,
      sections: {
        create: existing.sections.map((section) => ({
          title: section.title,
          sortOrder: section.sortOrder,
          questions: {
            create: section.questions.map((question) => ({
              text: question.text,
              type: question.type,
              required: question.required,
              sortOrder: question.sortOrder,
              options: {
                create: question.options.map((option) => ({
                  value: option.value,
                  sortOrder: option.sortOrder,
                })),
              },
            })),
          },
        })),
      },
    },
    include: {
      sections: {
        include: {
          questions: {
            include: { options: true },
          },
        },
      },
    },
  });

  return newSurvey;
};

// ─── Publish Survey (Add sections to existing survey) ───
export const publishSurvey = async (
  surveyId: string,
  userId: string,
  surveyData: CreateSurveyInput,
  sections: Array<{
    title: string;
    questions: Array<{
      text: string;
      type: string;
      required?: boolean;
      options?: Array<{ value: string }>;
    }>;
  }>
) => {
  // Update the survey metadata
  await prisma.survey.update({
    where: { id: surveyId },
    data: {
      title: surveyData.title,
      description: surveyData.description ?? null,
      category: surveyData.category ?? null,
      targetAudience: surveyData.audience ?? null,
      goal: surveyData.goal ?? null,
      usage: surveyData.usage ?? null,
      status: surveyData.status ?? "draft",
      responseLimit: surveyData.responseLimit ?? null,
      startDate: surveyData.startDate ? new Date(surveyData.startDate) : null,
      endDate: surveyData.endDate ? new Date(surveyData.endDate) : null,
    },
  });

  // Add sections with questions and options
  const survey = await prisma.survey.update({
    where: { id: surveyId },
    data: {
      sections: {
        create: sections.map((section, sIdx) => ({
          title: section.title,
          sortOrder: sIdx,
          questions: {
            create: section.questions.map((question, qIdx) => ({
              text: question.text,
              type: question.type,
              required: question.required ?? true,
              sortOrder: qIdx,
              options: question.options
                ? {
                    create: question.options.map((opt, oIdx) => ({
                      value: opt.value,
                      sortOrder: oIdx,
                    })),
                  }
                : undefined,
            })),
          },
        })),
      },
    },
    include: {
      sections: {
        include: {
          questions: {
            include: { options: true },
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return survey;
};

// ─── Save Draft ──────────────────────────────────────────
export const saveDraft = async (userId: string, input: DraftSurveyInput) => {
  const survey = await prisma.survey.create({
    data: {
      creatorId: userId,
      title: input.title ?? "Untitled Survey",
      description: input.description ?? null,
      category: input.category ?? null,
      targetAudience: input.audience ?? null,
      goal: input.goal ?? null,
      usage: input.usage ?? null,
      status: input.status ?? "draft",
      responseLimit: input.responseLimit ?? null,
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
      sections: input.sections
        ? {
            create: input.sections.map((section, sIdx) => ({
              title: section.title,
              sortOrder: sIdx,
              questions: section.questions
                ? {
                    create: section.questions.map((question, qIdx) => ({
                      text: question.text,
                      type: question.type,
                      required: question.required ?? true,
                      sortOrder: qIdx,
                      options: question.options
                        ? {
                            create: question.options.map((opt, oIdx) => ({
                              value: opt.value,
                              sortOrder: oIdx,
                            })),
                          }
                        : undefined,
                    })),
                  }
                : undefined,
            })),
          }
        : undefined,
    },
  });

  return { id: survey.id };
};

// ─── Update Draft ────────────────────────────────────────
export const updateDraft = async (surveyId: string, userId: string, input: DraftSurveyInput) => {
  const existing = await prisma.survey.findFirst({
    where: { id: surveyId, creatorId: userId },
  });
  if (!existing) throw new AppError("Survey not found", 404);

  // Update survey metadata
  await prisma.survey.update({
    where: { id: surveyId },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.audience !== undefined && { targetAudience: input.audience }),
      ...(input.goal !== undefined && { goal: input.goal }),
      ...(input.usage !== undefined && { usage: input.usage }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.responseLimit !== undefined && { responseLimit: input.responseLimit }),
      ...(input.startDate !== undefined && { startDate: new Date(input.startDate) }),
      ...(input.endDate !== undefined && { endDate: new Date(input.endDate) }),
    },
  });

  // If sections provided, replace all existing sections with new ones
  if (input.sections) {
    await prisma.surveySection.deleteMany({ where: { surveyId } });

    await prisma.survey.update({
      where: { id: surveyId },
      data: {
        sections: {
          create: input.sections.map((section, sIdx) => ({
            title: section.title,
            sortOrder: sIdx,
            questions: section.questions
              ? {
                  create: section.questions.map((question, qIdx) => ({
                    text: question.text,
                    type: question.type,
                    required: question.required ?? true,
                    sortOrder: qIdx,
                    options: question.options
                      ? {
                          create: question.options.map((opt, oIdx) => ({
                            value: opt.value,
                            sortOrder: oIdx,
                          })),
                        }
                      : undefined,
                  })),
                }
              : undefined,
          })),
        },
      },
    });
  }

  // Return the updated survey with full details
  const survey = await prisma.survey.findUnique({
    where: { id: surveyId },
    include: {
      sections: {
        include: {
          questions: {
            include: { options: { orderBy: { sortOrder: "asc" } } },
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return survey;
};

// ─── Publish Draft ───────────────────────────────────────
export const publishDraft = async (surveyId: string, userId: string) => {
  const survey = await prisma.survey.findFirst({
    where: { id: surveyId, creatorId: userId },
    include: {
      sections: {
        include: { questions: true },
      },
    },
  });
  if (!survey) throw new AppError("Survey not found", 404);

  // Validate required fields
  if (!survey.title || survey.title === "Untitled Survey") {
    throw new AppError("Survey title is required for publishing", 400);
  }
  if (survey.sections.length === 0) {
    throw new AppError("Survey must have at least one section", 400);
  }
  const hasQuestions = survey.sections.some((s) => s.questions.length > 0);
  if (!hasQuestions) {
    throw new AppError("Survey must have at least one question", 400);
  }

  const updated = await prisma.survey.update({
    where: { id: surveyId },
    data: { status: "active" },
  });

  return updated;
};
