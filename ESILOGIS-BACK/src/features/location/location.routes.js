const express = require("express");
const locationRouter = express.Router();
const locationController = require("./location.controller");
const { Role } = require("@prisma/client")
const {
    authenticate,
    restrictTo,
} = require("../../middleware/auth.middleware");
// Role IDs for access control

/**
 * @swagger
 * /api/location:
 *   get:
 *     summary: Get all locations
 *     tags: [Locations]
 *     responses:
 *       200:
 *         description: A list of locations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Location'
 *       500:
 *         description: Server error
 */
locationRouter.get(
    "/",
    authenticate,
    restrictTo(Role.ADMIN, Role.USER, Role.TECHNICIAN),
    locationController.getLocations
);

/**
 * @swagger
 * /api/location/{id}:
 *   get:
 *     summary: Get location by ID
 *     tags: [Locations]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Location ID
 *     responses:
 *       200:
 *         description: Location details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Location'
 *       404:
 *         description: Location not found
 *       500:
 *         description: Server error
 */
locationRouter.get(
    "/:id",
    authenticate,
    restrictTo(Role.ADMIN),
    locationController.getLocationById
);

/**
 * @swagger
 * /api/location:
 *   post:
 *     summary: Create a new location
 *     tags: [Locations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Location name
 *     responses:
 *       201:
 *         description: Location created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Location'
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
locationRouter.post(
    "/",
    authenticate,
    restrictTo(Role.ADMIN),
    locationController.createLocation
);

/**
 * @swagger
 * /api/location/{id}:
 *   put:
 *     summary: Update a location
 *     tags: [Locations]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Location ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Location name
 *     responses:
 *       200:
 *         description: Location updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Location'
 *       404:
 *         description: Location not found
 *       500:
 *         description: Server error
 */
locationRouter.put(
    "/:id",
    authenticate,
    restrictTo(Role.ADMIN),
    locationController.updateLocation
);

/**
 * @swagger
 * /api/location/{id}:
 *   delete:
 *     summary: Delete a location
 *     tags: [Locations]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Location ID
 *     responses:
 *       200:
 *         description: Location deleted successfully
 *       404:
 *         description: Location not found
 *       500:
 *         description: Server error
 */
locationRouter.delete(
    "/:id",
    authenticate,
    restrictTo(Role.ADMIN),
    locationController.deleteLocation
);
/**
 * @swagger
 * components:
 *   schemas:
 *     Location:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: integer
 *           description: Location ID
 *         name:
 *           type: string
 *           description: Location name
 */
module.exports = locationRouter;
