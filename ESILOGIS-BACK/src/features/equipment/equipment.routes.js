const express = require("express");
const equipmentRouter = express.Router();
const { Role } = require("@prisma/client");
const equipmentController = require("./equipment.controller");
const {
    authenticate,
    restrictTo,
} = require("../../middleware/auth.middleware");

/**
 * @swagger
 * /api/equipment:
 *   post:
 *     summary: Create a new equipment
 *     tags: [Equipments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - inventoryCode
 *               - locationId
 *               - typeId
 *             properties:
 *               inventoryCode:
 *                 type: string
 *                 description: Unique inventory code for the equipment
 *               locationId:
 *                 type: integer
 *                 description: ID of the location where the equipment is assigned
 *               typeId:
 *                 type: integer
 *                 description: ID of the equipment type
 *               status:
 *                 type: string
 *                 enum: [IN_SERVICE, OUT_OF_SERVICE, UNDER_MAINTENANCE]
 *                 description: Current state of the equipment
 *               commissionDate:
 *                 type: string
 *                 format: date-time
 *                 description: Date when the equipment was put into service
 *               acquisitionDate:
 *                 type: string
 *                 format: date-time
 *                 description: Date when the equipment was acquired
 *     responses:
 *       201:
 *         description: Equipment created successfully
 *       400:
 *         description: Invalid input - Missing required fields
 *       500:
 *         description: Internal server error
 */
equipmentRouter.post(
    "/",
    authenticate,
    restrictTo(Role.ADMIN),
    equipmentController.createEquipment
);

/**
 * @swagger
 * /api/equipment:
 *   get:
 *     summary: Get all equipment
 *     tags: [Equipments]
 *     description: Retrieve a list of all equipment from the database
 *     responses:
 *       200:
 *         description: A list of equipment
 *       500:
 *         description: Internal server error
 */
equipmentRouter.get("/", authenticate, equipmentController.getEquipments);

/**
 * @swagger
 * /api/equipment/{id}:
 *   get:
 *     summary: Get equipment by ID
 *     tags: [Equipments]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The equipment identifier
 *     responses:
 *       200:
 *         description: Equipment details
 *       404:
 *         description: Equipment not found
 *       500:
 *         description: Internal server error
 */
equipmentRouter.get(
    "/:id",
    authenticate,
    restrictTo(Role.ADMIN, Role.TECHNICIAN, Role.USER),
    equipmentController.getEquipmentById
);

/**
 * @swagger
 * /api/equipment/{id}:
 *   delete:
 *     summary: Delete equipment by ID
 *     tags: [Equipments]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The equipment identifier
 *     responses:
 *       200:
 *         description: Equipment successfully deleted
 *       404:
 *         description: Equipment not found
 *       500:
 *         description: Internal server error
 */
equipmentRouter.delete(
    "/:id",
    authenticate,
    restrictTo(Role.ADMIN),
    equipmentController.deleteEquipment
);

/**
 * @swagger
 * /api/equipment/{id}:
 *   put:
 *     summary: Update equipment by ID
 *     tags: [Equipments]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The equipment identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               locationId:
 *                 type: integer
 *                 description: ID of the location
 *               typeId:
 *                 type: integer
 *                 description: ID of the equipment type
 *               status:
 *                 type: string
 *                 enum: [IN_SERVICE, OUT_OF_SERVICE, UNDER_MAINTENANCE]
 *                 description: Current state of the equipment
 *     responses:
 *       200:
 *         description: Equipment updated successfully
 *       404:
 *         description: Equipment not found
 *       500:
 *         description: Internal server error
 */
equipmentRouter.put(
    "/:id",
    authenticate,
    restrictTo(Role.ADMIN, Role.TECHNICIAN),
    equipmentController.updateEquipment
);

/**
 * @swagger
 * /api/equipment/location/{id}:
 *   get:
 *     summary: Get equipment by location ID
 *     tags: [Equipments]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The location identifier
 *     responses:
 *       200:
 *         description: List of equipment in the location
 *       404:
 *         description: No equipment found for this location
 *       500:
 *         description: Internal server error
 */
equipmentRouter.get(
    "/location/:id",
    authenticate,
    restrictTo(Role.ADMIN, Role.TECHNICIAN, Role.USER),
    equipmentController.getEquipmentsByLocationId
);

module.exports = equipmentRouter;
