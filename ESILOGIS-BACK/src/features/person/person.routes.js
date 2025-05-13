const express = require("express");
const router = express.Router();
const personController = require("./person.controller");
const { Role } = require("@prisma/client");
const {
    restrictTo,
    authenticate,
} = require("../../middleware/auth.middleware");

/**
 * @swagger
 * /api/technicians:
 *   post:
 *     summary: Create a technician and his account
 *     tags: [Technicians]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Created Succesfully, returns the data
 *       401:
 *         description: Unauthorized - authentication required
 *       404:
 *         description: No person profile found for this user
 *       500:
 *         description: Server error
 */
router.post(
    "/",
    authenticate,
    restrictTo(Role.ADMIN),
    personController.createTechnician
);

/**
 * @swagger
 * /api/technicians:
 *   get:
 *     summary: Get All Technicians 
 *     tags: [Technicians]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Get All The Technicians 
 *       401:
 *         description: Unauthorized - authentication required
 *       404:
 *         description: No person profile found for this user
 *       500:
 *         description: Server error
 */
router.get(
    "/",
    authenticate,
    restrictTo(Role.ADMIN),
    personController.getAllTechnicians
);

router.get("/:id", authenticate, restrictTo(Role.ADMIN, Role.TECHNICIAN), personController.getTechnicianById);

/**
 * @swagger
 * /api/technicians/{id}:
 *   put:
 *     summary: Update the information of a technician (phoneNumber, departement)
 *     tags: [Technicians]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: updated Successfully
 *       401:
 *         description: Unauthorized - authentication required
 *       404:
 *         description: No person profile found for this user
 *       500:
 *         description: Server error
 */
router.put(
    "/:id",
    authenticate,
    restrictTo(Role.ADMIN),
    personController.updateTechnician
);

/**
 * @swagger
 * /api/technicians/{id}:
 *   delete:
 *     summary: Delete a technician
 *     tags: [Technicians]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Deleted Successfully
 *       401:
 *         description: Unauthorized - authentication required
 *       404:
 *         description: No person profile found for this user
 *       500:
 *         description: Server error
 */
router.delete(
    "/:id",
    authenticate,
    restrictTo(Role.ADMIN),
    personController.deleteTechnician
);


module.exports = router;
