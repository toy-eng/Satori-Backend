import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  updateSectionSchema,
  reorderSectionsSchema,
  createQuestionSchema,
  updateQuestionSchema,
  reorderQuestionsSchema,
  createOptionSchema,
  updateOptionSchema,
} from "../validators/survey.validator.js";
import * as sectionController from "../controllers/section.controller.js";

const router = Router();

// ─── Sections ───────────────────────────────────────────
// NB: "/reorder" must be registered before "/:id" so it isn't matched as an id.
router.put("/reorder", authenticate, validate(reorderSectionsSchema), sectionController.reorderSections);
router.put("/:id", authenticate, validate(updateSectionSchema), sectionController.updateSection);
router.delete("/:id", authenticate, sectionController.deleteSection);

// ─── Questions ──────────────────────────────────────────
router.post("/:id/questions", authenticate, validate(createQuestionSchema), sectionController.createQuestion);

export default router;
