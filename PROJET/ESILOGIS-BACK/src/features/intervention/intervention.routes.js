// src/features/intervention/intervention.routes.js
const express = require("express");
const router = express.Router();
const interventionController = require("./intervention.controller");
const {
    authenticate,
    restrictTo,
} = require("../../middleware/auth.middleware");
const { Role } = require("@prisma/client");
const { authorize } = require("passport");

/**
 * @swagger
 * tags:
 *   name: Interventions
 *   description: Management of maintenance interventions
 */

/**
 * @swagger
 * /api/intervention/my-assigned:
 *   get:
 *     summary: Get interventions assigned to the current user
 *     tags: [Interventions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of assigned interventions
 *       401:
 *         description: Unauthorized - authentication required
 *       404:
 *         description: No person profile found for this user
 *       500:
 *         description: Server error
 */
router.get(
    "/my-assigned",
    authenticate,
    restrictTo(Role.TECHNICIAN),
    interventionController.getMyAssignedInterventions
);

/**
 * @swagger
 * /api/intervention/my-reported:
 *   get:
 *     summary: Get interventions reported by the current user
 *     tags: [Interventions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of reported interventions
 *       401:
 *         description: Unauthorized - authentication required
 *       500:
 *         description: Server error
 */
router.get(
    "/my-reported",
    authenticate,
    restrictTo(Role.USER),
    interventionController.getMyReportedInterventions
);

/**
 * @swagger
 * /api/intervention:
 *   get:
 *     summary: Get all interventions
 *     tags: [Interventions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all interventions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Intervention'
 */
router.get(
    "/",
    authenticate,
    restrictTo(Role.ADMIN),
    interventionController.getInterventions
);

router.get("/planned", authenticate, restrictTo(Role.ADMIN), interventionController.getPlannedInterventions);


/**
 * @swagger
 * /api/intervention/{id}:
 *   get:
 *     summary: Get intervention by ID
 *     tags: [Interventions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Intervention ID
 *     responses:
 *       200:
 *         description: Intervention details
 *       401:
 *         description: Unauthorized - authentication required
 *       404:
 *         description: Intervention not found
 *       500:
 *         description: Server error
 */
router.get("/:id", authenticate, interventionController.getInterventionById);

/**
 * @swagger
 * /api/intervention:
 *   post:
 *     summary: Create a new intervention
 *     tags: [Interventions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *               - priority
 *               - locationId
 *             properties:
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *               locationId:
 *                 type: integer
 *               equipmentId:
 *                 type: integer
 */
router.post("/", authenticate, interventionController.createIntervention);

//Planify Intervention
/**
 * @swagger
 * /api/intervention/planify-intervention:
 *   post:
 *     summary: Plan a preventive maintenance intervention
 *     description: Create a scheduled preventive maintenance intervention with assigned technicians
 *     tags: [Interventions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *               - locationId
 *               - plannedAt
 *               - isRecurring
 *               - assignees
 *             properties:
 *               description:
 *                 type: string
 *                 description: Detailed description of the preventive maintenance
 *               locationId:
 *                 type: integer
 *                 description: ID of the location where intervention will take place
 *               plannedAt:
 *                 type: string
 *                 format: date-time
 *                 description: Scheduled date and time for the intervention
 *               isRecurring:
 *                 type: boolean
 *                 description: Whether this is a recurring maintenance
 *               recurrenceInterval:
 *                 type: integer
 *                 description: Interval in days between recurring maintenance (required if isRecurring is true)
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *                 default: MEDIUM
 *                 description: Priority level of the intervention
 *               equipmentId:
 *                 type: integer
 *                 description: Optional ID of equipment being maintained
 *               assignees:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of technician IDs who will be assigned to this intervention
 *     responses:
 *       201:
 *         description: Intervention planned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Intervention planned successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Intervention'
 *       400:
 *         description: Invalid input - Missing required fields or validation error
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - admin role required
 *       500:
 *         description: Server error
 */
router.post(
    "/planify-intervention",
    authenticate,
    restrictTo(Role.ADMIN),
    interventionController.planifyIntervention
);
/**
 * @swagger
 * /api/intervention/{id}:
 *   put:
 *     summary: Update an intervention
 *     tags: [Interventions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Intervention ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH]
 *               status:
 *                 type: string
 *                 enum: [PENDING, IN_PROGRESS, COMPLETED]
 *               locationId:
 *                 type: integer
 *               equipment_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Intervention updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - admin only
 *       404:
 *         description: Intervention not found
 *       500:
 *         description: Server error
 */
router.put(
    "/:id",
    authenticate,
    restrictTo(Role.ADMIN, Role.TECHNICIAN),
    interventionController.updateIntervention
);

/**
 * @swagger
 * /api/intervention/{id}:
 *   delete:
 *     summary: Delete an intervention
 *     tags: [Interventions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Intervention ID
 *     responses:
 *       200:
 *         description: Intervention deleted successfully
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - admin only
 *       404:
 *         description: Intervention not found
 *       500:
 *         description: Server error
 */
router.delete(
    "/:id",
    authenticate,
    restrictTo(Role.ADMIN),
    interventionController.deleteIntervention
);

/**
 * @swagger
 * /api/intervention/assign-multiple:
 *   post:
 *     summary: Assign multiple interventions to multiple technicians
 *     tags: [Interventions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - interventionIds
 *               - technicianIds
 *             properties:
 *               interventionIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of intervention IDs to assign
 *               technicianIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of technician IDs to assign to the interventions
 *     responses:
 *       200:
 *         description: Assignments created successfully
 *       400:
 *         description: Invalid input - missing or invalid required fields
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - admin only
 *       500:
 *         description: Server error
 */
router.post(
    "/assign-multiple",
    authenticate,
    restrictTo(Role.ADMIN),
    interventionController.assignMultiplePeople
);

// pause an intervention
/**
 * @swagger
 * /api/intervention/{id}/pause:
 *   put:
 *     summary: Pause an intervention
 *     tags: [Interventions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Intervention paused successfully
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - admin or technician role required
 */
router.put(
    "/:id/pause",
    authenticate,
    restrictTo(Role.TECHNICIAN),
    interventionController.pauseIntervention
);

// resume an intervention
router.put(
    "/:id/resume",
    authenticate,
    restrictTo(Role.TECHNICIAN),
    interventionController.resumeIntervention
);
/**
 * @swagger
 * /api/intervention/{id}/resolve:
 *   put:
 *     summary: Mark an intervention as resolved
 *     tags: [Interventions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               equipmentId:
 *                 type: integer
 *               action:
 *                 type: string
 *               notes:
 *                 type: string
 *               partsUsed:
 *                 type: string
 */
router.put(
    "/:id/resolve",
    authenticate,
    restrictTo(Role.ADMIN, Role.TECHNICIAN),
    interventionController.resolveIntervention
);

/**
 * @swagger
 * components:
 *   schemas:
 *     Intervention:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         description:
 *           type: string
 *         priority:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH]
 *         status:
 *           type: string
 *           enum: [PENDING, IN_PROGRESS, COMPLETED]
 *         locationId:
 *           type: integer
 *         equipmentId:
 *           type: integer
 *         reportedById:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         resolvedAt:
 *           type: string
 *           format: date-time
 */

module.exports = router;
