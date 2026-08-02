import { prisma } from "../config/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import type { SubmitResponseInput } from "../validators/survey.validator.js";

// ─── List Responses for a Survey ─────────────────────────
export const listSurveyResponses = async (
  surveyId: string,
  userId: string,
  page: number,
  limit: number,
  sortBy: string,
  order: string
) => {
  const survey = await prisma.survey.findFirst({
    where: { id: surveyId, creatorId: userId },
  });
  if (!survey) throw new AppError("Survey not found", 404);

  const sortField = sortBy === "completed_at" ? "completedAt" : "timeTakenSec";

  const [data, total] = await Promise.all([
    prisma.surveyResponse.findMany({
      where: { surveyId },
      orderBy: { [sortField]: order },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        answers: {
          include: {
            question: { select: { text: true, type: true, required: true } },
          },
        },
      },
    }),
    prisma.surveyResponse.count({ where: { surveyId } }),
  ]);

  return {
    data: data.map((response) => ({
      id: response.id,
      respondent_email: response.respondentEmail,
      completed_at: response.completedAt?.toISOString() ?? null,
      time_taken_sec: response.timeTakenSec,
      answers: response.answers.map((answer) => ({
        question_id: answer.questionId,
        question_text: answer.question.text,
        question_type: answer.question.type,
        question_required: answer.question.required,
        answer_text: answer.answerText,
        likert_value: answer.likertValue,
        yes_no_value: answer.yesNoValue,
        selected_options: answer.answerOptions
          ? (JSON.parse(answer.answerOptions) as string[])
          : [],
      })),
    })),
    pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
  };
};

// ─── Global Responses ────────────────────────────────────
export const listAllResponses = async (
  userId: string,
  page: number,
  limit: number
) => {
  const [data, total] = await Promise.all([
    prisma.surveyResponse.findMany({
      where: { survey: { creatorId: userId } },
      orderBy: { startedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        survey: { select: { id: true, title: true } },
      },
    }),
    prisma.surveyResponse.count({
      where: { survey: { creatorId: userId } },
    }),
  ]);

  return {
    data: data.map((response) => ({
      id: response.id,
      survey_id: response.survey.id,
      survey_title: response.survey.title,
      respondent_email: response.respondentEmail,
      completed_at: response.completedAt?.toISOString() ?? null,
      started_at: response.startedAt.toISOString(),
      time_taken_sec: response.timeTakenSec,
    })),
    pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
  };
};

// ─── Get Single Response ─────────────────────────────────
export const getResponseDetail = async (responseId: string, userId: string) => {
  const response = await prisma.surveyResponse.findFirst({
    where: { id: responseId, survey: { creatorId: userId } },
    include: {
      survey: { select: { id: true, title: true } },
      answers: {
        include: {
          question: { select: { text: true, type: true, required: true } },
        },
      },
    },
  });

  if (!response) throw new AppError("Response not found", 404);

  return {
    id: response.id,
    survey_id: response.survey.id,
    survey_title: response.survey.title,
    respondent_email: response.respondentEmail,
    started_at: response.startedAt.toISOString(),
    completed_at: response.completedAt?.toISOString() ?? null,
    time_taken_sec: response.timeTakenSec,
    completion_rate: response.completionRate,
    answers: response.answers.map((answer) => ({
      question_id: answer.questionId,
      question_text: answer.question.text,
      question_type: answer.question.type,
      question_required: answer.question.required,
      answer_text: answer.answerText,
      likert_value: answer.likertValue,
      yes_no_value: answer.yesNoValue,
      selected_options: answer.answerOptions
        ? (JSON.parse(answer.answerOptions) as string[])
        : [],
    })),
  };
};

// ─── Submit Response (Public) ────────────────────────────
export const submitResponse = async (
  surveyId: string,
  input: SubmitResponseInput
) => {
  const survey = await prisma.survey.findUnique({
    where: { id: surveyId },
    include: {
      sections: {
        include: {
          questions: true,
        },
      },
    },
  });

  if (!survey) throw new AppError("Survey not found", 404);
  if (survey.status !== "active") throw new AppError("Survey is not accepting responses", 403);

  // Check response limit (null or -1 means unlimited)
  if (survey.responseLimit && survey.responseLimit > 0) {
    const count = await prisma.surveyResponse.count({
      where: { surveyId },
    });
    if (count >= survey.responseLimit) {
      throw new AppError("Response limit reached", 403);
    }
  }

  // Build question map for validation
  const questionMap = new Map(
    survey.sections.flatMap((s) => s.questions.map((q) => [q.id, q]))
  );

  // Validate answers
  for (const answer of input.answers) {
    const question = questionMap.get(answer.question_id);
    if (!question) {
      throw new AppError(`Question ${answer.question_id} not found in this survey`, 400);
    }

    if (question.required) {
      const isEmpty =
        !answer.answer_text &&
        (!answer.answer_option_ids || answer.answer_option_ids.length === 0) &&
        answer.likert_value === undefined &&
        answer.yes_no_value === undefined;

      if (isEmpty) {
        throw new AppError(`Question "${question.text}" is required`, 400);
      }
    }

    // Type-specific validation
    if (question.type === "single_choice" && answer.answer_option_ids && answer.answer_option_ids.length !== 1) {
      throw new AppError(`Single choice question "${question.text}" requires exactly 1 selection`, 400);
    }
    if (question.type === "likert_scale" && answer.likert_value !== undefined) {
      if (answer.likert_value < 1 || answer.likert_value > 5) {
        throw new AppError(`Likert value for "${question.text}" must be between 1 and 5`, 400);
      }
    }
  }

  // ── Upsert participant from respondent email ───────────
  let participantId: string | null = null;
  if (input.respondent_email) {
    const participant = await prisma.participant.upsert({
      where: {
        surveyId_email: {
          surveyId,
          email: input.respondent_email,
        },
      },
      update: {}, // no-op — participant already exists
      create: {
        surveyId,
        email: input.respondent_email,
        userId: survey.creatorId,
        status: "active",
      },
    });
    participantId = participant.id;
  }

  const now = new Date();
  const response = await prisma.surveyResponse.create({
    data: {
      surveyId,
      participantId,
      respondentEmail: input.respondent_email ?? null,
      startedAt: now,
      completedAt: now,
      timeTakenSec: 0,
      completionRate: 100,
      answers: {
        create: input.answers.map((answer) => ({
          questionId: answer.question_id,
          answerText: answer.answer_text ?? null,
          answerOptions: answer.answer_option_ids
            ? JSON.stringify(answer.answer_option_ids)
            : null,
          likertValue: answer.likert_value ?? null,
          yesNoValue: answer.yes_no_value ?? null,
        })),
      },
    },
    include: {
      answers: true,
    },
  });

  return response;
};

// ─── Delete Response ─────────────────────────────────────
export const deleteResponse = async (responseId: string, userId: string) => {
  const response = await prisma.surveyResponse.findFirst({
    where: { id: responseId, survey: { creatorId: userId } },
  });
  if (!response) throw new AppError("Response not found", 404);

  await prisma.surveyResponse.delete({ where: { id: responseId } });
};

// ─── Export Responses ────────────────────────────────────
export const exportResponses = async (
  surveyId: string,
  userId: string,
  format: string
) => {
  const survey = await prisma.survey.findFirst({
    where: { id: surveyId, creatorId: userId },
  });
  if (!survey) throw new AppError("Survey not found", 404);

  const responses = await prisma.surveyResponse.findMany({
    where: { surveyId },
    include: {
      answers: {
        include: {
          question: { select: { text: true, type: true } },
        },
      },
    },
    orderBy: { startedAt: "desc" },
  });

  if (format === "csv") {
    // Build CSV
    const headers = [
      "Response ID",
      "Respondent Email",
      "Started At",
      "Completed At",
      "Time Taken (sec)",
      ...responses[0]?.answers.map((a) => a.question.text) ?? [],
    ];
    const rows = responses.map((r) => [
      r.id,
      r.respondentEmail ?? "",
      r.startedAt.toISOString(),
      r.completedAt?.toISOString() ?? "",
      String(r.timeTakenSec ?? ""),
      ...r.answers.map((a) => {
        if (a.answerText) return a.answerText;
        if (a.likertValue !== null) return String(a.likertValue);
        if (a.yesNoValue !== null) return a.yesNoValue ? "Yes" : "No";
        if (a.answerOptions) {
          try {
            return (JSON.parse(a.answerOptions) as string[]).join("; ");
          } catch {
            return "";
          }
        }
        return "";
      }),
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    return { content: csvContent, contentType: "text/csv", filename: `${survey.title}-responses.csv` };
  }

  // JSON format
  const data = responses.map((r) => ({
    id: r.id,
    respondent_email: r.respondentEmail,
    started_at: r.startedAt.toISOString(),
    completed_at: r.completedAt?.toISOString() ?? null,
    time_taken_sec: r.timeTakenSec,
    answers: r.answers.map((a) => ({
      question: a.question.text,
      answer_text: a.answerText,
      likert_value: a.likertValue,
      yes_no_value: a.yesNoValue,
      selected_options: a.answerOptions ? (JSON.parse(a.answerOptions) as string[]) : [],
    })),
  }));

  return { content: JSON.stringify(data, null, 2), contentType: "application/json", filename: `${survey.title}-responses.json` };
};
