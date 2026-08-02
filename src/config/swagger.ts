export const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "Eye_Patch Survey System API",
    version: "1.0.0",
    description:
      "RESTful API for the Eye_Patch Survey System. Supports survey creation, management, response collection, participant management, analytics, and more.",
    contact: {
      name: "API Support",
      email: "support@eyepatch.dev",
    },
  },
  servers: [
    {
      url: "http://localhost:3000/api/v1",
      description: "Development server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Error message" },
          errors: {
            type: "array",
            items: { type: "object" },
            description: "Validation error details",
          },
        },
      },
      Pagination: {
        type: "object",
        properties: {
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 20 },
          total: { type: "integer", example: 42 },
          total_pages: { type: "integer", example: 3 },
        },
      },
      // ─── Auth ──────────────────────────────────────────
      SignupInput: {
        type: "object",
        required: ["email", "userName", "password"],
        properties: {
          email: { type: "string", format: "email", example: "user@example.com" },
          userName: { type: "string", minLength: 3, example: "johndoe" },
          password: { type: "string", minLength: 8, example: "Str0ng!Pass" },
        },
      },
      LoginInput: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "user@example.com" },
          password: { type: "string", example: "Str0ng!Pass" },
        },
      },
      AuthResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string" },
          data: {
            type: "object",
            properties: {
              token: { type: "string" },
              user: {
                type: "object",
                properties: {
                  id: { type: "string", format: "uuid" },
                  email: { type: "string" },
                  userName: { type: "string" },
                },
              },
            },
          },
        },
      },
      UserProfileResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "User fetched successfully" },
          data: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid", example: "550e8400-e29b-41d4-a716-446655440000" },
              email: { type: "string", format: "email", example: "user@example.com" },
              userName: { type: "string", example: "johndoe" },
              createdAt: { type: "string", format: "date-time", example: "2026-07-29T12:00:00.000Z" },
            },
          },
        },
      },
      UpdatePasswordInput: {
        type: "object",
        required: ["currentPassword", "newPassword"],
        properties: {
          currentPassword: { type: "string", example: "Str0ng!Pass" },
          newPassword: { type: "string", minLength: 8, example: "NewStr0ng!Pass" },
        },
      },
      // ─── User / Profile ────────────────────────────────
      Profile: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string" },
          user_name: { type: "string" },
          avatar_url: { type: "string", nullable: true },
          created_at: { type: "string", format: "date-time" },
          settings: {
            type: "object",
            nullable: true,
            properties: {
              appearance: { type: "string", enum: ["light", "dark"] },
              accent_color: { type: "string" },
              theme_picture: { type: "string", nullable: true },
            },
          },
        },
      },
      UpdateProfileInput: {
        type: "object",
        properties: {
          user_name: { type: "string", example: "new_username" },
          avatar_url: { type: "string", example: "https://example.com/avatar.png" },
        },
      },
      UpdateUsernameInput: {
        type: "object",
        required: ["userName"],
        properties: {
          userName: { type: "string", minLength: 3, example: "new_username" },
        },
      },
      UpdateAvatarInput: {
        type: "object",
        required: ["avatarUrl"],
        properties: {
          avatarUrl: { type: "string", example: "https://example.com/avatar.png" },
        },
      },
      // ─── Survey ────────────────────────────────────────
      SurveyListItem: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string" },
          description: { type: "string", nullable: true },
          status: { type: "string", enum: ["draft", "active", "inactive", "closed"] },
          category: { type: "string", nullable: true },
          response_count: { type: "integer" },
          avg_response_time: { type: "integer", description: "Average response time in seconds" },
          completion_rate: { type: "number", description: "Completion rate percentage (0-100)" },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      SurveyListResponse: {
        type: "object",
        properties: {
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/SurveyListItem" },
          },
          pagination: { $ref: "#/components/schemas/Pagination" },
        },
      },
      CreateSurveyInput: {
        type: "object",
        required: ["title", "description", "category", "audience", "goal", "usage", "responseLimit", "sections"],
        properties: {
          title: { type: "string", maxLength: 255, example: "Customer Satisfaction Survey" },
          description: { type: "string", example: "Help us improve our service" },
          category: { type: "string", example: "feedback" },
          audience: { type: "string", example: "customers" },
          goal: { type: "string", example: "To understand customer satisfaction levels" },
          usage: { type: "string", example: "improve-service" },
          responseLimit: { type: "integer", example: -1 },
          startDate: { type: "string", format: "date", example: "2026-07-01" },
          endDate: { type: "string", format: "date", example: "2026-07-31" },
          sections: {
            type: "array",
            items: {
              type: "object",
              required: ["title", "questions"],
              properties: {
                title: { type: "string", example: "Section 1" },
                questions: {
                  type: "array",
                  items: {
                    type: "object",
                    required: ["text", "type"],
                    properties: {
                      text: { type: "string", example: "How satisfied are you?" },
                      type: { type: "string", enum: ["text", "multiple_choice", "single_choice", "likert_scale", "yes_no"] },
                      required: { type: "boolean", default: true },
                      options: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: { value: { type: "string", example: "Option A" } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      SurveyDetail: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string" },
          description: { type: "string", nullable: true },
          category: { type: "string", nullable: true },
          status: { type: "string", enum: ["draft", "active", "inactive", "closed"] },
          responseLimit: { type: "integer", nullable: true },
          startDate: { type: "string", format: "date", nullable: true },
          endDate: { type: "string", format: "date", nullable: true },
          sections: {
            type: "array",
            items: { $ref: "#/components/schemas/SectionDetail" },
          },
        },
      },
      UpdateStatusInput: {
        type: "object",
        required: ["status"],
        properties: {
          status: { type: "string", enum: ["draft", "active", "inactive", "closed"] },
        },
      },
      // ─── Section ───────────────────────────────────────
      SectionDetail: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string" },
          sortOrder: { type: "integer" },
          questions: {
            type: "array",
            items: { $ref: "#/components/schemas/QuestionDetail" },
          },
        },
      },
      CreateSectionInput: {
        type: "object",
        required: ["title"],
        properties: {
          title: { type: "string", example: "Section 1" },
          sort_order: { type: "integer", default: 0 },
          questions: {
            type: "array",
            items: { $ref: "#/components/schemas/CreateQuestionWithOptions" },
          },
        },
      },
      UpdateSectionInput: {
        type: "object",
        properties: {
          title: { type: "string" },
          sort_order: { type: "integer" },
        },
      },
      ReorderInput: {
        type: "object",
        required: ["section_ids"],
        properties: {
          section_ids: {
            type: "array",
            items: { type: "string", format: "uuid" },
          },
        },
      },
      // ─── Question ──────────────────────────────────────
      QuestionDetail: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          text: { type: "string" },
          type: { type: "string", enum: ["text", "multiple_choice", "single_choice", "likert_scale", "yes_no"] },
          required: { type: "boolean" },
          sortOrder: { type: "integer" },
          options: {
            type: "array",
            items: { $ref: "#/components/schemas/OptionDetail" },
          },
        },
      },
      CreateQuestionWithOptions: {
        type: "object",
        required: ["text", "type"],
        properties: {
          text: { type: "string", example: "How satisfied are you?" },
          type: { type: "string", enum: ["text", "multiple_choice", "single_choice", "likert_scale", "yes_no"] },
          required: { type: "boolean", default: true },
          sort_order: { type: "integer", default: 0 },
          options: {
            type: "array",
            items: {
              type: "object",
              properties: {
                value: { type: "string", example: "Option A" },
                sort_order: { type: "integer", default: 0 },
              },
            },
          },
        },
      },
      CreateQuestionInput: {
        type: "object",
        required: ["text", "type"],
        properties: {
          text: { type: "string" },
          type: { type: "string", enum: ["text", "multiple_choice", "single_choice", "likert_scale", "yes_no"] },
          required: { type: "boolean", default: true },
          sort_order: { type: "integer", default: 0 },
          options: {
            type: "array",
            items: {
              type: "object",
              properties: {
                value: { type: "string" },
                sort_order: { type: "integer", default: 0 },
              },
            },
          },
        },
      },
      UpdateQuestionInput: {
        type: "object",
        properties: {
          text: { type: "string" },
          type: { type: "string", enum: ["text", "multiple_choice", "single_choice", "likert_scale", "yes_no"] },
          required: { type: "boolean" },
          sort_order: { type: "integer" },
        },
      },
      // ─── Option ────────────────────────────────────────
      OptionDetail: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          questionId: { type: "string", format: "uuid" },
          value: { type: "string" },
          sortOrder: { type: "integer" },
        },
      },
      CreateOptionInput: {
        type: "object",
        required: ["value"],
        properties: {
          value: { type: "string", example: "New Option" },
          sort_order: { type: "integer", default: 0 },
        },
      },
      UpdateOptionInput: {
        type: "object",
        properties: {
          value: { type: "string" },
          sort_order: { type: "integer" },
        },
      },
      // ─── Publish Survey ────────────────────────────────
      PublishSurveyInput: {
        type: "object",
        required: ["survey", "sections"],
        properties: {
          survey: { $ref: "#/components/schemas/CreateSurveyInput" },
          sections: {
            type: "array",
            items: {
              type: "object",
              required: ["title", "questions"],
              properties: {
                title: { type: "string" },
                questions: {
                  type: "array",
                  items: {
                    type: "object",
                    required: ["text", "type"],
                    properties: {
                      text: { type: "string" },
                      type: { type: "string", enum: ["text", "multiple_choice", "single_choice", "likert_scale", "yes_no"] },
                      required: { type: "boolean", default: true },
                      options: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: { value: { type: "string" } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      // ─── Draft Survey ───────────────────────────────────
      DraftSurveyInput: {
        type: "object",
        properties: {
          title: { type: "string", maxLength: 255, example: "Customer Satisfaction Survey" },
          description: { type: "string", example: "Help us improve our service" },
          category: { type: "string", example: "feedback" },
          audience: { type: "string", example: "customers" },
          goal: { type: "string", example: "To understand satisfaction levels" },
          usage: { type: "string", example: "improve-service" },
          responseLimit: { type: "integer", example: -1, nullable: true },
          startDate: { type: "string", format: "date", example: "2026-07-01" },
          endDate: { type: "string", format: "date", example: "2026-07-15" },
          status: { type: "string", enum: ["draft", "active", "inactive", "closed"] },
          sections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string", example: "Section 1" },
                questions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      text: { type: "string", example: "How satisfied are you?" },
                      type: { type: "string", enum: ["text", "multiple_choice", "single_choice", "likert_scale", "yes_no"] },
                      required: { type: "boolean", default: true },
                      options: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: { value: { type: "string", example: "Option A" } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      // ─── Response ──────────────────────────────────────
      SurveyResponseItem: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          respondent_email: { type: "string", nullable: true },
          completed_at: { type: "string", format: "date-time", nullable: true },
          time_taken_sec: { type: "integer", nullable: true },
          answers: {
            type: "array",
            items: { $ref: "#/components/schemas/ResponseAnswer" },
          },
        },
      },
      ResponseAnswer: {
        type: "object",
        properties: {
          question_id: { type: "string", format: "uuid" },
          question_text: { type: "string" },
          question_type: { type: "string", enum: ["text", "multiple_choice", "single_choice", "likert_scale", "yes_no"] },
          question_required: { type: "boolean", description: "Whether this question was marked as required" },
          answer_text: { type: "string", nullable: true },
          likert_value: { type: "integer", nullable: true },
          yes_no_value: { type: "boolean", nullable: true },
          selected_options: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
      SubmitResponseInput: {
        type: "object",
        properties: {
          respondent_email: {
            type: "string",
            format: "email",
            example: "user@example.com",
            description: "Email of the respondent. Providing this auto-creates or links a Participant record for this survey.",
          },
          answers: {
            type: "array",
            items: {
              type: "object",
              required: ["question_id"],
              properties: {
                question_id: { type: "string", format: "uuid" },
                answer_text: { type: "string" },
                answer_option_ids: {
                  type: "array",
                  items: { type: "string", format: "uuid" },
                },
                likert_value: { type: "integer", minimum: 1, maximum: 5 },
                yes_no_value: { type: "boolean" },
              },
            },
          },
        },
      },
      GlobalResponseItem: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          survey_id: { type: "string", format: "uuid" },
          survey_title: { type: "string" },
          respondent_email: { type: "string", nullable: true },
          completed_at: { type: "string", format: "date-time", nullable: true },
          started_at: { type: "string", format: "date-time" },
          time_taken_sec: { type: "integer", nullable: true },
        },
      },
      // ─── Participant ───────────────────────────────────
      Participant: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", nullable: true },
          email: { type: "string", nullable: true },
          status: { type: "string" },
          survey_id: { type: "string", format: "uuid", description: "Survey this participant belongs to" },
          survey_title: { type: "string", description: "Title of the survey" },
          response_count: { type: "integer" },
          created_at: { type: "string", format: "date-time" },
        },
      },
      ParticipantDetail: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", nullable: true },
          email: { type: "string", nullable: true },
          status: { type: "string" },
          survey_id: { type: "string", format: "uuid" },
          survey_title: { type: "string" },
          created_at: { type: "string", format: "date-time" },
          responses: {
            type: "array",
            items: {
              type: "object",
              properties: {
                response_id: { type: "string", format: "uuid" },
                survey_id: { type: "string", format: "uuid" },
                completed_at: { type: "string", format: "date-time", nullable: true },
                time_taken_sec: { type: "integer", nullable: true },
              },
            },
          },
          response_count: { type: "integer" },
        },
      },
      AddParticipantsInput: {
        type: "object",
        required: ["participants"],
        properties: {
          participants: {
            type: "array",
            items: {
              type: "object",
              properties: {
                email: { type: "string", format: "email", example: "user1@example.com" },
                name: { type: "string", example: "User One" },
              },
            },
          },
        },
      },
      UpdateParticipantInput: {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string", format: "email" },
          status: { type: "string", enum: ["active", "inactive"] },
        },
      },
      // ─── Dashboard ─────────────────────────────────────
      DashboardStats: {
        type: "object",
        properties: {
          survey_quantity: { type: "integer", example: 13 },
          total_responses: { type: "integer", example: 124 },
          questions_responded: { type: "integer", example: 580 },
          new_questions: { type: "integer", example: 83 },
          change_percentages: {
            type: "object",
            properties: {
              survey_quantity: { type: "integer", example: 8 },
              total_responses: { type: "integer", example: 12 },
              questions_responded: { type: "integer", example: 3 },
              new_questions: { type: "integer", example: 80 },
            },
          },
          weekly_trend: {
            type: "object",
            description: "Daily counts for the last 7 days (oldest first, today last)",
            properties: {
              survey_quantity: {
                type: "array",
                items: { type: "integer" },
                example: [2, 3, 5, 4, 4, 3, 3],
              },
              total_responses: {
                type: "array",
                items: { type: "integer" },
                example: [65, 70, 72, 68, 75, 71, 68],
              },
              questions_responded: {
                type: "array",
                items: { type: "integer" },
                example: [170, 180, 175, 190, 185, 175, 175],
              },
              new_questions: {
                type: "array",
                items: { type: "integer" },
                example: [1, 0, 2, 1, 1, 2, 1],
              },
            },
          },
        },
      },
      RecentSurveyItem: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string" },
          status: { type: "string" },
          description: { type: "string", nullable: true },
          author_name: { type: "string" },
          author_avatar: { type: "string" },
          response_count: { type: "integer" },
          response_limit: { type: "integer", nullable: true },
          created_at: { type: "string", format: "date-time" },
        },
      },
      SurveyAnalytics: {
        type: "object",
        properties: {
          total_responses: { type: "integer" },
          completion_rate: { type: "number" },
          average_time_sec: { type: "integer" },
          responses_over_time: {
            type: "array",
            items: {
              type: "object",
              properties: {
                date: { type: "string", format: "date" },
                count: { type: "integer" },
              },
            },
          },
          question_breakdown: {
            type: "array",
            items: {
              type: "object",
              properties: {
                question_id: { type: "string", format: "uuid" },
                question_text: { type: "string" },
                type: { type: "string" },
                responses: { type: "object" },
                average: { type: "number" },
              },
            },
          },
        },
      },
      // ─── Settings ──────────────────────────────────────
      UserSettings: {
        type: "object",
        properties: {
          appearance: { type: "string", enum: ["light", "dark"], example: "dark" },
          accent_color: { type: "string", example: "blue" },
          theme_picture: { type: "string", nullable: true, example: "nature" },
        },
      },
      UpdateAppearanceAccentInput: {
        type: "object",
        required: ["appearance", "accent_color"],
        properties: {
          appearance: { type: "string", enum: ["light", "dark"], example: "dark" },
          accent_color: { type: "string", example: "blue" },
        },
      },
      // ─── Search ────────────────────────────────────────
      SearchResults: {
        type: "object",
        properties: {
          surveys: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                title: { type: "string" },
                status: { type: "string" },
              },
            },
          },
          participants: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                name: { type: "string", nullable: true },
                email: { type: "string", nullable: true },
              },
            },
          },
          responses: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                respondent_email: { type: "string", nullable: true },
                survey_id: { type: "string", format: "uuid" },
              },
            },
          },
        },
      },
      // ─── Landing ───────────────────────────────────────
      LandingStats: {
        type: "object",
        properties: {
          stats: {
            type: "array",
            items: {
              type: "object",
              properties: {
                tag: { type: "string" },
                percent: { type: "string" },
                info: { type: "string" },
                note: { type: "string" },
              },
            },
          },
        },
      },
      LandingFaq: {
        type: "object",
        properties: {
          faq: {
            type: "array",
            items: {
              type: "object",
              properties: {
                question: { type: "string" },
                answer: { type: "string" },
              },
            },
          },
        },
      },
      LandingNews: {
        type: "object",
        properties: {
          news: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                date: { type: "string", format: "date" },
                excerpt: { type: "string" },
              },
            },
          },
        },
      },
      ContactInput: {
        type: "object",
        required: ["name", "email", "message"],
        properties: {
          name: { type: "string", example: "John Doe" },
          email: { type: "string", format: "email", example: "john@example.com" },
          message: { type: "string", example: "I'd like a demo of your survey platform." },
        },
      },
    },
  },
  paths: {
    // ════════════════════════════════════════════════════════
    // AUTHENTICATION
    // ════════════════════════════════════════════════════════
    "/auth/signup": {
      post: {
        tags: ["Authentication"],
        summary: "Register a new user",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/SignupInput" } } },
        },
        responses: {
          "201": {
            description: "Account created successfully",
            content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } },
          },
          "409": { description: "Email already in use" },
          "400": { description: "Validation error" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Login with email/password",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/LoginInput" } } },
        },
        responses: {
          "200": {
            description: "Login successful",
            content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } },
          },
          "401": { description: "Invalid email or password" },
        },
      },
    },
    "/auth/google": {
      post: {
        tags: ["Authentication"],
        summary: "Google OAuth login",
        requestBody: {
          content: { "application/json": { schema: { type: "object", properties: { id_token: { type: "string" } } } } },
        },
        responses: { "200": { description: "Login successful (placeholder)" } },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Authentication"],
        summary: "Get current authenticated user",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Current user data",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UserProfileResponse" },
              },
            },
          },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Authentication"],
        summary: "Logout current session",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Logged out successfully" } },
      },
    },
    "/auth/refresh": {
      post: {
        tags: ["Authentication"],
        summary: "Refresh access token",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Token refreshed (placeholder)" } },
      },
    },
    "/auth/password": {
      put: {
        tags: ["Authentication"],
        summary: "Update current user's password",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdatePasswordInput" },
            },
          },
        },
        responses: {
          "200": { description: "Password updated successfully" },
          "401": { description: "Current password is incorrect" },
          "400": { description: "Validation error" },
        },
      },
    },

    // ════════════════════════════════════════════════════════
    // USER / PROFILE
    // ════════════════════════════════════════════════════════
    "/users/me": {
      get: {
        tags: ["Users / Profile"],
        summary: "Get my profile",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Profile data",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Profile" } } },
          },
        },
      },
      delete: {
        tags: ["Users / Profile"],
        summary: "Delete my account",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Account deleted" } },
      },
    },
    "/users/me/username": {
      put: {
        tags: ["Users / Profile"],
        summary: "Update username",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateUsernameInput" },
            },
          },
        },
        responses: { "200": { description: "Username updated" } },
      },
    },
    "/users/me/avatar": {
      put: {
        tags: ["Users / Profile"],
        summary: "Update avatar profile (accepts a URL string)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateAvatarInput" },
            },
          },
        },
        responses: { "200": { description: "Avatar updated" } },
      },
    },
    "/users/{id}": {
      get: {
        tags: ["Users / Profile"],
        summary: "Get user by ID (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: { "200": { description: "User data" }, "404": { description: "User not found" } },
      },
    },

    // ════════════════════════════════════════════════════════
    // DASHBOARD
    // ════════════════════════════════════════════════════════
    "/dashboard/stats": {
      get: {
        tags: ["Dashboard / Analytics"],
        summary: "Get dashboard statistics",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Dashboard stats",
            content: { "application/json": { schema: { $ref: "#/components/schemas/DashboardStats" } } },
          },
        },
      },
    },
    "/dashboard/recent-surveys": {
      get: {
        tags: ["Dashboard / Analytics"],
        summary: "Get recent surveys",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "limit", in: "query", schema: { type: "integer", default: 5, maximum: 50 } },
        ],
        responses: {
          "200": {
            description: "Recent surveys list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/RecentSurveyItem" } },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ════════════════════════════════════════════════════════
    // SURVEYS
    // ════════════════════════════════════════════════════════
    "/surveys": {
      get: {
        tags: ["Surveys"],
        summary: "List my surveys (with filters)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "status", in: "query", schema: { type: "string", enum: ["draft", "active", "inactive", "closed"] } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
          { name: "sort_by", in: "query", schema: { type: "string", enum: ["created_at", "title", "status"], default: "created_at" } },
          { name: "order", in: "query", schema: { type: "string", enum: ["asc", "desc"], default: "desc" } },
        ],
        responses: {
          "200": {
            description: "Paginated survey list",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SurveyListResponse" } } },
          },
        },
      },
      post: {
        tags: ["Surveys"],
        summary: "Create a new survey",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateSurveyInput" } } },
        },
        responses: { "201": { description: "Survey created" } },
      },
    },
    "/surveys/draft": {
      post: {
        tags: ["Surveys"],
        summary: "Save a draft survey (all fields optional)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: { "application/json": { schema: { $ref: "#/components/schemas/DraftSurveyInput" } } },
        },
        responses: {
          "201": {
            description: "Draft created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { id: { type: "string", format: "uuid" } },
                },
              },
            },
          },
        },
      },
    },
    "/surveys/{id}": {
      get: {
        tags: ["Surveys"],
        summary: "Get survey detail (public — returns only active surveys)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": {
            description: "Survey detail with sections and questions",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SurveyDetail" } } },
          },
          "404": { description: "Survey not found or not active" },
        },
      },
      put: {
        tags: ["Surveys"],
        summary: "Update a draft survey (partial data + sections)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          content: { "application/json": { schema: { $ref: "#/components/schemas/DraftSurveyInput" } } },
        },
        responses: { "200": { description: "Survey draft updated" } },
      },
      delete: {
        tags: ["Surveys"],
        summary: "Delete a survey",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": { description: "Survey deleted" } },
      },
    },
    "/surveys/{id}/status": {
      patch: {
        tags: ["Surveys"],
        summary: "Change survey status",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateStatusInput" } } },
        },
        responses: { "200": { description: "Status updated" } },
      },
    },
    "/surveys/{id}/duplicate": {
      post: {
        tags: ["Surveys"],
        summary: "Duplicate a survey with all sections and questions",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "201": { description: "Survey duplicated" } },
      },
    },
    "/surveys/{id}/publish": {
      post: {
        tags: ["Surveys"],
        summary: "Publish a draft (validates required fields & sets status to active)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": { description: "Survey published successfully" },
          "400": { description: "Validation failed — missing required fields" },
          "404": { description: "Survey not found" },
        },
      },
    },

    // ════════════════════════════════════════════════════════
    // SECTIONS
    // ════════════════════════════════════════════════════════
    "/surveys/{id}/sections": {
      post: {
        tags: ["Sections & Questions"],
        summary: "Add a section (with questions) to a survey",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateSectionInput" } } },
        },
        responses: { "201": { description: "Section created" } },
      },
    },
    "/sections/reorder": {
      put: {
        tags: ["Sections & Questions"],
        summary: "Reorder sections",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ReorderInput" } } },
        },
        responses: { "200": { description: "Sections reordered" } },
      },
    },
    "/sections/{id}": {
      put: {
        tags: ["Sections & Questions"],
        summary: "Update a section",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateSectionInput" } } },
        },
        responses: { "200": { description: "Section updated" } },
      },
      delete: {
        tags: ["Sections & Questions"],
        summary: "Delete a section and all its questions",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": { description: "Section deleted" } },
      },
    },
    "/sections/{id}/questions": {
      post: {
        tags: ["Sections & Questions"],
        summary: "Add a question to a section",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateQuestionInput" } } },
        },
        responses: { "201": { description: "Question created" } },
      },
    },

    // ════════════════════════════════════════════════════════
    // QUESTIONS
    // ════════════════════════════════════════════════════════
    "/questions/reorder": {
      put: {
        tags: ["Sections & Questions"],
        summary: "Reorder questions",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["question_ids"],
                properties: {
                  question_ids: { type: "array", items: { type: "string", format: "uuid" } },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Questions reordered" } },
      },
    },
    "/questions/{id}": {
      put: {
        tags: ["Sections & Questions"],
        summary: "Update a question",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateQuestionInput" } } },
        },
        responses: { "200": { description: "Question updated" } },
      },
      delete: {
        tags: ["Sections & Questions"],
        summary: "Delete a question and its options",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": { description: "Question deleted" } },
      },
    },
    "/questions/{id}/options": {
      post: {
        tags: ["Sections & Questions"],
        summary: "Add option to a question",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateOptionInput" } } },
        },
        responses: { "201": { description: "Option created" } },
      },
    },

    // ════════════════════════════════════════════════════════
    // OPTIONS
    // ════════════════════════════════════════════════════════
    "/options/{id}": {
      put: {
        tags: ["Sections & Questions"],
        summary: "Update an option",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateOptionInput" } } },
        },
        responses: { "200": { description: "Option updated" } },
      },
      delete: {
        tags: ["Sections & Questions"],
        summary: "Delete an option",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": { description: "Option deleted" } },
      },
    },

    // ════════════════════════════════════════════════════════
    // RESPONSES
    // ════════════════════════════════════════════════════════
    "/surveys/{id}/responses": {
      get: {
        tags: ["Responses"],
        summary: "List responses for a survey",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
          { name: "sort_by", in: "query", schema: { type: "string", enum: ["completed_at", "time_taken_sec"] } },
          { name: "order", in: "query", schema: { type: "string", enum: ["asc", "desc"] } },
        ],
        responses: {
          "200": {
            description: "Paginated responses with answers",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/SurveyResponseItem" } },
                    pagination: { $ref: "#/components/schemas/Pagination" },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Responses"],
        summary: "Submit a survey response (public, no auth required)",
        description:
          "Submits answers for a survey. If `respondent_email` is provided, a Participant record is automatically created (or reused) for that email + survey combination, and the response is linked to it. The participant will then appear in the global participant list for the survey owner.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/SubmitResponseInput" } } },
        },
        responses: {
          "201": { description: "Response submitted" },
          "403": { description: "Survey closed or response limit reached" },
          "400": { description: "Validation error" },
        },
      },
    },
    "/surveys/{id}/responses/export": {
      get: {
        tags: ["Responses"],
        summary: "Export responses (CSV or JSON)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "format", in: "query", schema: { type: "string", enum: ["csv", "json"], default: "json" } },
        ],
        responses: { "200": { description: "File download" } },
      },
    },
    "/survey/{id}/analytics": {
      get: {
        tags: ["Dashboard / Analytics"],
        summary: "Get analytics for a specific survey",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": {
            description: "Survey analytics",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SurveyAnalytics" } } },
          },
        },
      },
    },
    "/responses": {
      get: {
        tags: ["Responses"],
        summary: "Global responses (all surveys)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
        ],
        responses: {
          "200": {
            description: "Paginated global responses",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/GlobalResponseItem" } },
                    pagination: { $ref: "#/components/schemas/Pagination" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/responses/{id}": {
      get: {
        tags: ["Responses"],
        summary: "Get a single response with answers",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": {
            description: "Response detail with answers (includes question_type and question_required per answer)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string", format: "uuid" },
                    survey_id: { type: "string", format: "uuid" },
                    survey_title: { type: "string" },
                    respondent_email: { type: "string", nullable: true },
                    started_at: { type: "string", format: "date-time" },
                    completed_at: { type: "string", format: "date-time", nullable: true },
                    time_taken_sec: { type: "integer", nullable: true },
                    completion_rate: { type: "number", nullable: true },
                    answers: {
                      type: "array",
                      items: { $ref: "#/components/schemas/ResponseAnswer" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      delete: {
        tags: ["Responses"],
        summary: "Delete a response",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": { description: "Response deleted" } },
      },
    },

    // ════════════════════════════════════════════════════════
    // PARTICIPANTS
    // ════════════════════════════════════════════════════════
    "/surveys/{id}/participants": {
      get: {
        tags: ["Participants"],
        summary: "List participants for a survey",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
          { name: "search", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Paginated participant list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/Participant" } },
                    pagination: { $ref: "#/components/schemas/Pagination" },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Participants"],
        summary: "Add participant(s) to a survey",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/AddParticipantsInput" } } },
        },
        responses: { "201": { description: "Participants added" } },
      },
    },
    "/participants": {
      get: {
        tags: ["Participants"],
        summary: "List all participants (global)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
          { name: "search", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Paginated global participant list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/Participant" } },
                    pagination: { $ref: "#/components/schemas/Pagination" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/participants/bulk-import": {
      post: {
        tags: ["Participants"],
        summary: "Bulk import participants from CSV data",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  csv: { type: "string", description: "CSV text with columns: survey_id, email, name" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Bulk import completed" } },
      },
    },
    "/participants/{id}": {
      get: {
        tags: ["Participants"],
        summary: "Get participant detail with response history",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": {
            description: "Participant detail",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ParticipantDetail" } } },
          },
        },
      },
      put: {
        tags: ["Participants"],
        summary: "Update participant info",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateParticipantInput" } } },
        },
        responses: { "200": { description: "Participant updated" } },
      },
      delete: {
        tags: ["Participants"],
        summary: "Remove participant",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": { description: "Participant deleted" } },
      },
    },
    "/participants/{id}/send-email": {
      post: {
        tags: ["Participants"],
        summary: "Send survey email to participant",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": { description: "Email sent (placeholder)" } },
      },
    },

    // ════════════════════════════════════════════════════════
    // SETTINGS
    // ════════════════════════════════════════════════════════
    "/settings": {
      get: {
        tags: ["Settings"],
        summary: "Get user settings",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "User settings",
            content: { "application/json": { schema: { $ref: "#/components/schemas/UserSettings" } } },
          },
        },
      },
    },
    "/settings/appearance-accent": {
      put: {
        tags: ["Settings"],
        summary: "Update appearance and accent color together",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateAppearanceAccentInput" },
            },
          },
        },
        responses: { "200": { description: "Appearance and accent color updated" } },
      },
    },
    "/settings/theme-picture": {
      put: {
        tags: ["Settings"],
        summary: "Update theme picture",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["theme_picture"],
                properties: { theme_picture: { type: "string" } },
              },
            },
          },
        },
        responses: { "200": { description: "Theme picture updated" } },
      },
    },

    // ════════════════════════════════════════════════════════
    // SEARCH
    // ════════════════════════════════════════════════════════
    "/search": {
      get: {
        tags: ["Search"],
        summary: "Global search across surveys, responses, participants",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "q", in: "query", required: true, schema: { type: "string" }, description: "Search query" },
          { name: "type", in: "query", schema: { type: "string", enum: ["surveys", "responses", "participants", "all"], default: "all" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10, maximum: 50 } },
        ],
        responses: {
          "200": {
            description: "Search results",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SearchResults" } } },
          },
        },
      },
    },

    // ════════════════════════════════════════════════════════
    // LANDING PAGE
    // ════════════════════════════════════════════════════════
    "/landing/stats": {
      get: {
        tags: ["Landing Page"],
        summary: "Get impact stats for landing page",
        responses: {
          "200": {
            description: "Landing page stats",
            content: { "application/json": { schema: { $ref: "#/components/schemas/LandingStats" } } },
          },
        },
      },
    },
    "/landing/faq": {
      get: {
        tags: ["Landing Page"],
        summary: "Get FAQ data",
        responses: {
          "200": {
            description: "FAQ data",
            content: { "application/json": { schema: { $ref: "#/components/schemas/LandingFaq" } } },
          },
        },
      },
    },
    "/landing/news": {
      get: {
        tags: ["Landing Page"],
        summary: "Get news & updates",
        responses: {
          "200": {
            description: "News data",
            content: { "application/json": { schema: { $ref: "#/components/schemas/LandingNews" } } },
          },
        },
      },
    },
    "/contact": {
      post: {
        tags: ["Landing Page"],
        summary: "Submit contact/demo inquiry",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ContactInput" } } },
        },
        responses: { "200": { description: "Inquiry submitted" } },
      },
    },

    // ════════════════════════════════════════════════════════
    // HEALTH
    // ════════════════════════════════════════════════════════
    "/health": {
      get: {
        tags: ["System"],
        summary: "Health check endpoint",
        responses: {
          "200": {
            description: "Server is running",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    data: {
                      type: "object",
                      properties: { timestamp: { type: "string", format: "date-time" } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
