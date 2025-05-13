const equipmentService = require("./equipment.service");
const logger = require("../../utils/logger");

// Create Equipment
async function createEquipment(req, res) {
    try {
        const { inventoryCode, locationId, typeId } = req.body;

        // Validate required fields
        if (!inventoryCode || !locationId || !typeId) {
            return res.status(400).json({
                success: false,
                message:
                    "Required fields are missing (inventoryCode, locationId, typeId)",
            });
        }

        const newEquipment = await equipmentService.createEquipment(req.body);
        logger.info(`Equipment created: ${newEquipment.id}`);

        return res.status(201).json({
            success: true,
            message: "Equipment created successfully",
            data: newEquipment,
        });
    } catch (error) {
        logger.error(`Error creating equipment: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: "Failed to create equipment",
            error: error.message,
        });
    }
}

// Get All Equipments
async function getEquipments(req, res) {
    try {
        const equipments = await equipmentService.getEquipments();
        logger.info("Equipment list retrieved successfully");

        return res.status(200).json({
            success: true,
            message: "Equipment list retrieved successfully",
            data: equipments,
        });
    } catch (error) {
        logger.error(`Error fetching equipment list: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve equipment list",
        });
    }
}

// Get Equipment by ID
async function getEquipmentById(req, res) {
    try {
        const equipmentId = parseInt(req.params.id);
        const equipment = await equipmentService.getEquipmentById(equipmentId);

        if (!equipment) {
            logger.warn(`Equipment not found: ${equipmentId}`);
            return res.status(404).json({
                success: false,
                message: "Equipment not found",
            });
        }

        logger.info(`Equipment retrieved: ${equipmentId}`);
        return res.status(200).json({
            success: true,
            message: "Equipment retrieved successfully",
            data: equipment,
        });
    } catch (error) {
        logger.error(`Error fetching equipment by ID: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve equipment",
        });
    }
}

// Delete Equipment
async function deleteEquipment(req, res) {
    try {
        const equipmentId = parseInt(req.params.id);
        const equipment = await equipmentService.deleteEquipment(equipmentId);

        if (!equipment) {
            logger.warn(`Equipment not found for deletion: ${equipmentId}`);
            return res.status(404).json({
                success: false,
                message: "Equipment not found",
            });
        }

        logger.info(`Equipment deleted: ${equipmentId}`);
        return res.status(200).json({
            success: true,
            message: "Equipment deleted successfully",
        });
    } catch (error) {
        logger.error(`Error deleting equipment: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: "Failed to delete equipment",
        });
    }
}

// Update Equipment
async function updateEquipment(req, res) {
    try {
        const equipmentId = parseInt(req.params.id);
        const equipment = await equipmentService.updateEquipment(
            equipmentId,
            req.body
        );

        if (!equipment) {
            logger.warn(`Equipment not found for update: ${equipmentId}`);
            return res.status(404).json({
                success: false,
                message: "Equipment not found",
            });
        }

        logger.info(`Equipment updated: ${equipmentId}`);
        return res.status(200).json({
            success: true,
            message: "Equipment updated successfully",
            data: equipment,
        });
    } catch (error) {
        logger.error(`Error updating equipment: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: "Failed to update equipment",
        });
    }
}

async function getEquipmentsByLocationId(req, res) {
    try {
        const locationId = parseInt(req.params.id);
        const equipments = await equipmentService.getEquipmentsByLocationId(
            locationId
        );

        if (!equipments || equipments.length === 0) {
            logger.warn(`No equipment found for location: ${locationId}`);
            return res.status(404).json({
                success: false,
                message: "No equipment found for this location",
            });
        }

        logger.info(`Equipment retrieved for location: ${locationId}`);
        return res.status(200).json({
            success: true,
            message: "Equipments retrieved successfully",
            data: equipments,
        });
    } catch (error) {
        logger.error(
            `Error fetching equipment by location ID: ${error.message}`
        );
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve equipment for location",
        });
    }
}

module.exports = {
    createEquipment,
    getEquipments,
    getEquipmentById,
    deleteEquipment,
    updateEquipment,
    getEquipmentsByLocationId,
};
