const express = require("express");
const equipmentTypeRouter = express.Router();
const equipmentTypeController = require("./equipmentType.controller");
const { Role } = require("@prisma/client");
const {
    authenticate,
    restrictTo,
} = require("../../middleware/auth.middleware");



/**
 * @swagger
 * /api/equipement-type:
 *   get:
 *     summary: Returns all equipment types
 *     tags: [EquipmentTypes]
 *     responses:
 *       200:
 *         description: A list of equipment types
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/EquipmentType'
 *       500:
 *         description: Server error
 */
equipmentTypeRouter.get(
    "/",
    authenticate,
    restrictTo(Role.ADMIN),
    equipmentTypeController.getAllEquipmentTypes
);

/**
 * @swagger
 * /api/equipement-type:
 *   post:
 *     summary: Creates a new equipment type
 *     tags: [EquipmentTypes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *     responses:
 *       201:
 *         description: The equipment type was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EquipmentType'
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
equipmentTypeRouter.post(
    "/",
    authenticate,
    restrictTo(Role.ADMIN),
    equipmentTypeController.createEquipmentType
);

/**
 * @swagger
 * /api/equipement-type/{id}:
 *   delete:
 *     summary: Deletes an equipment type
 *     tags: [EquipmentTypes]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the equipment type to delete
 *     responses:
 *       200:
 *         description: Equipment type successfully deleted
 *       404:
 *         description: Equipment type not found
 *       500:
 *         description: Server error
 */
equipmentTypeRouter.delete(
    "/:id",
    authenticate,
    restrictTo(Role.ADMIN),
    equipmentTypeController.deleteEquipmentType
);
/**
 * @swagger
 * components:
 *   schemas:
 *     EquipmentType:
 *       type: object
 *       required:
 *         - name
 *         - category
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         category:
 *           type: string
 */

module.exports = equipmentTypeRouter;
