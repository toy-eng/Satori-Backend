import { prisma } from "../config/prisma.js";

// ─── Helpers ────────────────────────────────────────────

/** Generate the last 7 days (today included) as YYYY-MM-DD strings, oldest first. */
function getLast7Days(): { start: Date; end: Date; dates: string[] } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const start = new Date(now);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().split("T")[0]!);
  }

  return { start, end, dates };
}

/** Bucket records by their date field and fill missing days with 0. */
function bucketByDay(dates: string[], records: { date: Date }[]): number[] {
  const map = new Map<string, number>();
  for (const r of records) {
    const day = r.date.toISOString().split("T")[0]!;
    map.set(day, (map.get(day) ?? 0) + 1);
  }
  return dates.map((d) => map.get(d) ?? 0);
}

// ─── Service ────────────────────────────────────────────

export const getStats = async (userId: string) => {
  const surveyQuantity = await prisma.survey.count({
    where: { creatorId: userId },
  });

  const totalResponses = await prisma.surveyResponse.count({
    where: { survey: { creatorId: userId } },
  });

  const questionsResponded = await prisma.responseAnswer.count({
    where: { response: { survey: { creatorId: userId } } },
  });

  const newQuestions = await prisma.surveyQuestion.count({
    where: { section: { survey: { creatorId: userId } } },
  });

  // ── Weekly trends (last 7 days, oldest → today) ──────
  const { start, end, dates } = getLast7Days();

  const [recentSurveys, recentResponses, recentAnswers, recentQuestions] = await Promise.all([
    prisma.survey.findMany({
      where: { creatorId: userId, createdAt: { gte: start, lte: end } },
      select: { createdAt: true },
    }),
    prisma.surveyResponse.findMany({
      where: { survey: { creatorId: userId }, startedAt: { gte: start, lte: end } },
      select: { startedAt: true },
    }),
    prisma.responseAnswer.findMany({
      where: { response: { survey: { creatorId: userId } }, createdAt: { gte: start, lte: end } },
      select: { createdAt: true },
    }),
    prisma.surveyQuestion.findMany({
      where: { section: { survey: { creatorId: userId } }, createdAt: { gte: start, lte: end } },
      select: { createdAt: true },
    }),
  ]);

  const weekly_trend = {
    survey_quantity: bucketByDay(dates, recentSurveys.map((s) => ({ date: s.createdAt }))),
    total_responses: bucketByDay(dates, recentResponses.map((r) => ({ date: r.startedAt }))),
    questions_responded: bucketByDay(dates, recentAnswers.map((a) => ({ date: a.createdAt }))),
    new_questions: bucketByDay(dates, recentQuestions.map((q) => ({ date: q.createdAt }))),
  };

  return {
    survey_quantity: surveyQuantity,
    total_responses: totalResponses,
    questions_responded: questionsResponded,
    new_questions: newQuestions,
    change_percentages: {
      survey_quantity: 0,
      total_responses: 0,
      questions_responded: 0,
      new_questions: 0,
    },
    weekly_trend,
  };
};

export const getRecentSurveys = async (userId: string, limit: number) => {
  const surveys = await prisma.survey.findMany({
    where: { creatorId: userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      _count: {
        select: { responses: true },
      },
      creator: {
        select: { userName: true, avatarUrl: true },
      },
    },
  });

  return surveys.map((survey) => ({
    id: survey.id,
    title: survey.title,
    status: survey.status,
    description: survey.description,
    author_name: survey.creator.userName,
    author_avatar: survey.creator.avatarUrl ?? "",
    response_count: survey._count.responses,
    response_limit: survey.responseLimit,
    created_at: survey.createdAt.toISOString(),
  }));
};

export const getSurveyAnalytics = async (surveyId: string, userId: string) => {
  const survey = await prisma.survey.findFirst({
    where: { id: surveyId, creatorId: userId },
    include: {
      responses: {
        include: {
          answers: true,
        },
      },
      sections: {
        include: {
          questions: {
            include: {
              options: true,
            },
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!survey) {
    return null;
  }

  const totalResponses = survey.responses.length;
  const completedResponses = survey.responses.filter(
    (r) => r.completedAt !== null
  ).length;
  const completionRate =
    totalResponses > 0
      ? parseFloat(((completedResponses / totalResponses) * 100).toFixed(1))
      : 0;

  const averageTimeSec = (() => {
    const times = survey.responses
      .filter((r) => r.timeTakenSec !== null)
      .map((r) => r.timeTakenSec!);
    if (times.length === 0) return 0;
    return Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  })();

  // responses over time (last 30 days)
  const responsesOverTime = (() => {
    const dateMap = new Map<string, number>();
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0]!;
      dateMap.set(key, 0);
    }
    for (const r of survey.responses) {
      const key = r.startedAt.toISOString().split("T")[0]!;
      if (dateMap.has(key)) {
        dateMap.set(key, (dateMap.get(key) ?? 0) + 1);
      }
    }
    return Array.from(dateMap.entries()).map(([date, count]) => ({
      date,
      count,
    }));
  })();

  // question breakdown
  const questionBreakdown = survey.sections.flatMap((section) =>
    section.questions.map((question) => {
      const answers = survey.responses.flatMap((r) =>
        r.answers.filter((a) => a.questionId === question.id)
      );

      const responses: Record<string, number> = {};

      if (question.type === "likert_scale") {
        const values = answers
          .filter((a) => a.likertValue !== null)
          .map((a) => a.likertValue!);
        for (let i = 1; i <= 5; i++) {
          responses[String(i)] = values.filter((v) => v === i).length;
        }
        const avg =
          values.length > 0
            ? parseFloat(
                (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)
              )
            : 0;
        return {
          question_id: question.id,
          question_text: question.text,
          type: question.type,
          responses,
          average: avg,
        };
      }

      if (question.type === "yes_no" || question.type === "true_false") {
        const yesCount = answers.filter((a) => a.yesNoValue === true).length;
        const noCount = answers.filter((a) => a.yesNoValue === false).length;
        return {
          question_id: question.id,
          question_text: question.text,
          type: question.type,
          responses: { yes: yesCount, no: noCount },
          average: 0,
        };
      }

      if (question.type === "multiple_choice" || question.type === "single_choice") {
        // answerOptions stores option *IDs*; resolve them back to option values
        // so the breakdown keys line up with what the frontend displays.
        const optionValueById = new Map(
          question.options.map((option) => [option.id, option.value])
        );
        for (const option of question.options) {
          responses[option.value] = 0;
        }
        for (const answer of answers) {
          if (answer.answerOptions) {
            try {
              const selected = JSON.parse(answer.answerOptions) as string[];
              for (const optionId of selected) {
                const value = optionValueById.get(optionId) ?? optionId;
                responses[value] = (responses[value] ?? 0) + 1;
              }
            } catch {
              // skip invalid JSON
            }
          }
        }
        return {
          question_id: question.id,
          question_text: question.text,
          type: question.type,
          responses,
          average: 0,
        };
      }

      // text type
      return {
        question_id: question.id,
        question_text: question.text,
        type: question.type,
        responses: { answers: answers.filter((a) => a.answerText).length },
        average: 0,
      };
    })
  );

  return {
    total_responses: totalResponses,
    completion_rate: completionRate,
    average_time_sec: averageTimeSec,
    responses_over_time: responsesOverTime,
    question_breakdown: questionBreakdown,
  };
};
