import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as surveyService from "../services/survey.service.js";
import { listSurveysQuerySchema } from "../validators/survey.validator.js";

export const listSurveys = asyncHandler(async (req: Request, res: Response) => {
  const parsed = listSurveysQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: parsed.error.issues,
    });
    return;
  }
  const result = await surveyService.listSurveys(req.userId!, parsed.data);
  res.status(200).json(result);
});

export const createSurvey = asyncHandler(async (req: Request, res: Response) => {
  const survey = await surveyService.createSurvey(req.userId!, req.body);
  res.status(201).json({ success: true, message: "Survey created successfully", data: survey });
});

export const getSurveyDetail = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params["id"] as string;
  const survey = await surveyService.getSurveyDetail(id, req.userId);
  res.status(200).json({ success: true, data: survey });
});

export const updateSurvey = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params["id"] as string;
  const survey = await surveyService.updateSurvey(id, req.userId!, req.body);
  res.status(200).json({ success: true, message: "Survey updated successfully", data: survey });
});

export const deleteSurvey = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params["id"] as string;
  await surveyService.deleteSurvey(id, req.userId!);
  res.status(200).json({ success: true, message: "Survey deleted successfully" });
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params["id"] as string;
  const survey = await surveyService.updateStatus(id, req.userId!, req.body);
  res.status(200).json({ success: true, message: "Survey status updated", data: survey });
});

export const duplicateSurvey = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params["id"] as string;
  const survey = await surveyService.duplicateSurvey(id, req.userId!);
  res.status(201).json({ success: true, message: "Survey duplicated successfully", data: survey });
});

export const saveDraft = asyncHandler(async (req: Request, res: Response) => {
  const result = await surveyService.saveDraft(req.userId!, req.body);
  res.status(201).json(result);
});

export const updateDraft = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params["id"] as string;
  const survey = await surveyService.updateDraft(id, req.userId!, req.body);
  res.status(200).json({ success: true, message: "Survey draft updated", data: survey });
});

export const publishDraft = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params["id"] as string;
  const survey = await surveyService.publishDraft(id, req.userId!);
  res.status(200).json({ success: true, message: "Survey published successfully", data: survey });
});
