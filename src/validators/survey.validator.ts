import { z } from "zod";

const surveyStatusEnum = z.enum(["draft", "active", "inactive", "closed"]);
const questionTypeEnum = z.enum([
  "text",
  "multiple_choice",
  "single_choice",
  "likert_scale",
  "yes_no",
  "true_false",
]);

// ─── List Surveys Query ──────────────────────────────────
export const listSurveysQuerySchema = z.object({
  status: surveyStatusEnum.optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  page: z
    .string()
    .optional()
    .transform((val) => {
      const num = val ? parseInt(val, 10) : 1;
      return isNaN(num) || num < 1 ? 1 : num;
    }),
  limit: z
    .string()
    .optional()
    .transform((val) => {
      const num = val ? parseInt(val, 10) : 20;
      return isNaN(num) || num < 1 ? 20 : Math.min(num, 100);
    }),
  sort_by: z.enum(["created_at", "title", "status"]).optional().default("created_at"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
});

// ─── Create Survey ───────────────────────────────────────
export const createSurveySchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  audience: z.string().min(1, "Audience is required"),
  goal: z.string().min(1, "Goal is required"),
  usage: z.string().min(1, "Usage is required"),
  responseLimit: z.number().int(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sections: z.array(
    z.object({
      title: z.string().min(1).max(255),
      questions: z.array(
        z.object({
          text: z.string().min(1),
          type: questionTypeEnum,
          required: z.boolean().optional().default(true),
          options: z
            .array(
              z.object({
                value: z.string().min(1),
              })
            )
            .optional(),
        })
      ),
    })
  ),
});

// ─── Update Survey ───────────────────────────────────────
export const updateSurveySchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  target_audience: z.string().optional(),
  goal: z.string().optional(),
  usage: z.string().optional(),
  response_limit: z.number().int().positive().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

// ─── Update Status ───────────────────────────────────────
export const updateStatusSchema = z.object({
  status: surveyStatusEnum,
});

// ─── Create Section ──────────────────────────────────────
export const createSectionSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  sort_order: z.number().int().optional().default(0),
  questions: z
    .array(
      z.object({
        text: z.string().min(1, "Question text is required"),
        type: questionTypeEnum,
        required: z.boolean().optional().default(true),
        sort_order: z.number().int().optional().default(0),
        options: z
          .array(
            z.object({
              value: z.string().min(1, "Option value is required"),
              sort_order: z.number().int().optional().default(0),
            })
          )
          .optional(),
      })
    )
    .optional(),
});

// ─── Update Section ──────────────────────────────────────
export const updateSectionSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  sort_order: z.number().int().optional(),
});

// ─── Reorder Sections ────────────────────────────────────
export const reorderSectionsSchema = z.object({
  section_ids: z.array(z.string().uuid()),
});

// ─── Create Question ─────────────────────────────────────
export const createQuestionSchema = z.object({
  text: z.string().min(1, "Question text is required"),
  type: questionTypeEnum,
  required: z.boolean().optional().default(true),
  sort_order: z.number().int().optional().default(0),
  options: z
    .array(
      z.object({
        value: z.string().min(1, "Option value is required"),
        sort_order: z.number().int().optional().default(0),
      })
    )
    .optional(),
});

// ─── Update Question ─────────────────────────────────────
export const updateQuestionSchema = z.object({
  text: z.string().min(1).optional(),
  type: questionTypeEnum.optional(),
  required: z.boolean().optional(),
  sort_order: z.number().int().optional(),
});

// ─── Reorder Questions ───────────────────────────────────
export const reorderQuestionsSchema = z.object({
  question_ids: z.array(z.string().uuid()),
});

// ─── Create Option ───────────────────────────────────────
export const createOptionSchema = z.object({
  value: z.string().min(1, "Option value is required"),
  sort_order: z.number().int().optional().default(0),
});

// ─── Update Option ───────────────────────────────────────
export const updateOptionSchema = z.object({
  value: z.string().min(1).optional(),
  sort_order: z.number().int().optional(),
});

// ─── Publish Survey ──────────────────────────────────────
export const publishSurveySchema = z.object({
  survey: createSurveySchema,
  sections: z.array(
    z.object({
      title: z.string().min(1, "Section title is required"),
      questions: z.array(
        z.object({
          text: z.string().min(1, "Question text is required"),
          type: questionTypeEnum,
          required: z.boolean().optional().default(true),
          options: z
            .array(
              z.object({
                value: z.string().min(1, "Option value is required"),
              })
            )
            .optional(),
        })
      ),
    })
  ),
});

// ─── Response Submission ─────────────────────────────────
export const submitResponseSchema = z.object({
  respondent_email: z.string().email().optional(),
  answers: z.array(
    z.object({
      question_id: z.string().uuid(),
      answer_text: z.string().optional(),
      answer_option_ids: z.array(z.string().uuid()).optional(),
      likert_value: z.number().int().min(1).max(5).optional(),
      yes_no_value: z.boolean().optional(),
    })
  ),
});

// ─── Export Query ────────────────────────────────────────
export const exportQuerySchema = z.object({
  format: z.enum(["csv", "json"]).optional().default("json"),
});

// ─── Draft Survey (all fields optional) ───────────────────
export const draftSurveySchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  audience: z.string().optional(),
  goal: z.string().optional(),
  usage: z.string().optional(),
  responseLimit: z.number().int().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: surveyStatusEnum.optional(),
  sections: z
    .array(
      z.object({
        title: z.string().min(1).max(255),
        questions: z
          .array(
            z.object({
              text: z.string().min(1),
              type: questionTypeEnum,
              required: z.boolean().optional().default(true),
              options: z
                .array(
                  z.object({
                    value: z.string().min(1),
                  })
                )
                .optional(),
            })
          )
          .optional(),
      })
    )
    .optional(),
});

export type CreateSurveyInput = z.infer<typeof createSurveySchema>;
export type UpdateSurveyInput = z.infer<typeof updateSurveySchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type CreateSectionInput = z.infer<typeof createSectionSchema>;
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;
export type ReorderSectionsInput = z.infer<typeof reorderSectionsSchema>;
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type ReorderQuestionsInput = z.infer<typeof reorderQuestionsSchema>;
export type CreateOptionInput = z.infer<typeof createOptionSchema>;
export type UpdateOptionInput = z.infer<typeof updateOptionSchema>;
export type PublishSurveyInput = z.infer<typeof publishSurveySchema>;
export type SubmitResponseInput = z.infer<typeof submitResponseSchema>;
export type ListSurveysQuery = z.infer<typeof listSurveysQuerySchema>;
export type DraftSurveyInput = z.infer<typeof draftSurveySchema>;
