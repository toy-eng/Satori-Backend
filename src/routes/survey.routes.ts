import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  createSurveySchema,
  updateStatusSchema,
  createSectionSchema,
  draftSurveySchema,
  submitResponseSchema,
} from "../validators/survey.validator.js";
import * as surveyController from "../controllers/survey.controller.js";
import * as sectionController from "../controllers/section.controller.js";
import * as responseController from "../controllers/response.controller.js";
import * as participantController from "../controllers/participant.controller.js";
import * as dashboardController from "../controllers/dashboard.controller.js";

const router = Router();

// ─── Draft ──────────────────────────────────────────────
router.post("/draft", authenticate, validate(draftSurveySchema), surveyController.saveDraft);

// ─── Survey CRUD ─────────────────────────────────────────
router.get("/", authenticate, surveyController.listSurveys);
router.post("/", authenticate, validate(createSurveySchema), surveyController.createSurvey);
router.get("/:id", surveyController.getSurveyDetail);
router.put("/:id", authenticate, validate(draftSurveySchema), surveyController.updateDraft);
router.delete("/:id", authenticate, surveyController.deleteSurvey);
router.patch("/:id/status", authenticate, validate(updateStatusSchema), surveyController.updateStatus);
router.post("/:id/duplicate", authenticate, surveyController.duplicateSurvey);

// ─── Publish ────────────────────────────────────────────
router.post("/:id/publish", authenticate, surveyController.publishDraft);

// ─── Sections ───────────────────────────────────────────
router.post("/:id/sections", authenticate, validate(createSectionSchema), sectionController.createSection);

// ─── Responses ──────────────────────────────────────────
router.get("/:id/responses", authenticate, responseController.listSurveyResponses);
router.post("/:id/responses", validate(submitResponseSchema), responseController.submitResponse);
router.get("/:id/responses/export", authenticate, responseController.exportResponses);

// ─── Participants ───────────────────────────────────────
router.get("/:id/participants", authenticate, participantController.listSurveyParticipants);
router.post("/:id/participants", authenticate, participantController.addParticipants);

// ─── Analytics ──────────────────────────────────────────
router.get("/:id/analytics", authenticate, dashboardController.getSurveyAnalytics);

export default router;
