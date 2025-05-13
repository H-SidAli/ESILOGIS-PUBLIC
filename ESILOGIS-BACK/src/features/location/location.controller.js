const locationService = require("./location.service");
const logger = require("../../utils/logger");

// Create Location
async function createLocation(req, res) {
    try {
        const { name } = req.body;

        // Validate required fields
        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Location name is required"
            });
        }

        const newLocation = await locationService.createLocation(req.body);
        logger.info(`Location created: ${newLocation.id} - ${name}`);
        
        return res.status(201).json({
            success: true,
            message: "Location created successfully",
            data: newLocation
        });
    } catch (error) {
        logger.error(`Error creating location: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: "Failed to create location"
        });
    }
}

// Get All Locations
async function getLocations(req, res) {
    try {
        const locations = await locationService.getLocations();
        logger.info("Location list retrieved successfully");
        
        return res.status(200).json({
            success: true,
            message: "Locations retrieved successfully",
            data: locations
        });
    } catch (error) {
        logger.error(`Error fetching locations list: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve locations"
        });
    }
}

// Get Location by ID
async function getLocationById(req, res) {
    try {
        const locationId = parseInt(req.params.id);
        const location = await locationService.getLocationById(locationId);

        if (!location) {
            logger.warn(`Location not found: ${locationId}`);
            return res.status(404).json({
                success: false,
                message: "Location not found"
            });
        }

        logger.info(`Location retrieved: ${locationId}`);
        return res.status(200).json({
            success: true,
            message: "Location retrieved successfully",
            data: location
        });
    } catch (error) {
        logger.error(`Error fetching location by ID: ${error.message}`);
        return res.status(500).json({
            success: false, 
            message: "Failed to retrieve location"
        });
    }
}

// Delete Location
async function deleteLocation(req, res) {
    try {
        const locationId = parseInt(req.params.id);
        const location = await locationService.deleteLocation(locationId);

        if (!location) {
            logger.warn(`Location not found for deletion: ${locationId}`);
            return res.status(404).json({
                success: false,
                message: "Location not found"
            });
        }

        logger.info(`Location deleted: ${locationId}`);
        return res.status(200).json({
            success: true,
            message: "Location deleted successfully"
        });
    } catch (error) {
        logger.error(`Error deleting location: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: "Failed to delete location"
        });
    }
}

// Update Location
async function updateLocation(req, res) {
    try {
        const locationId = parseInt(req.params.id);
        const location = await locationService.updateLocation(
            locationId,
            req.body
        );

        if (!location) {
            logger.warn(`Location not found for update: ${locationId}`);
            return res.status(404).json({
                success: false,
                message: "Location not found"
            });
        }

        logger.info(`Location updated: ${locationId}`);
        return res.status(200).json({
            success: true,
            message: "Location updated successfully",
            data: location
        });
    } catch (error) {
        logger.error(`Error updating location: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: "Failed to update location"
        });
    }
}

module.exports = {
    createLocation,
    getLocations,
    getLocationById,
    deleteLocation,
    updateLocation,
};