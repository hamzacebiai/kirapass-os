import { Router } from "express";

import {
  approvePhotoController,
  expireIdentityController,
  failIdentityController,
  getIdentityController,
  getPhotoController,
  initiateIdentityController,
  listIdentityController,
  listPhotoController,
  rejectPhotoController,
  retryIdentityController,
  reviewPhotoController,
  startIdentityController,
  submitPhotoController,
  verifyIdentityController,
} from "./controller.js";

const router = Router();

// Identity verification
router.get("/verifications/identity", listIdentityController);
router.post("/verifications/identity", initiateIdentityController);
router.get("/verifications/identity/:id", getIdentityController);
router.post("/verifications/identity/:id/start", startIdentityController);
router.post("/verifications/identity/:id/verify", verifyIdentityController);
router.post("/verifications/identity/:id/fail", failIdentityController);
router.post("/verifications/identity/:id/expire", expireIdentityController);
router.post("/verifications/identity/:id/retry", retryIdentityController);

// Photo verification
router.get("/verifications/photo", listPhotoController);
router.post("/verifications/photo", submitPhotoController);
router.get("/verifications/photo/:id", getPhotoController);
router.post("/verifications/photo/:id/review", reviewPhotoController);
router.post("/verifications/photo/:id/approve", approvePhotoController);
router.post("/verifications/photo/:id/reject", rejectPhotoController);

export default router;
