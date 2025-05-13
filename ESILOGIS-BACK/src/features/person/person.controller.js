const personService = require("./person.service");
const { body, validationResult } = require("express-validator");
const logger = require("../../utils/logger");

async function createTechnician(req, res) {
    try {
        console.log(req.body);
        // Validate input data
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors.array()
            });
        }

        const {
            lastName,
            firstName,
            phoneNumber,
            email,
            departmentId,
            createUserAccount,
            password,
        } = req.body;

        // Basic validation check
        if (!lastName || !firstName || !email) {
            return res.status(400).json({
                success: false,
                message: "Required fields are missing (lastName, firstName, email)"
            });
        }

        // Call service to create technician
        const result = await personService.createTechnician(req.body);

        if (!result) {
            logger.error(`Failed to create technician: ${email}`);
            return res.status(400).json({ 
                success: false,
                message: "Technician creation failed" 
            });
        }

        logger.info(`Technician created successfully: ${result.technician.id}`);
        res.status(201).json({
            success: true,
            message: "Technician created successfully",
            data: {
                technician: result.technician,
                userAccount: result.userAccount
                    ? {
                          id: result.userAccount.id,
                          email: result.userAccount.email,
                      }
                    : null
            }
        });
    } catch (error) {
        logger.error(`Error creating technician: ${error.message}`);
        res.status(500).json({ 
            success: false,
            message: "Failed to create technician",
            error: error.message 
        });
    }
}

// Function to get all technicians
async function getAllTechnicians(req, res) {
    try {
        const technicians = await personService.getAllTechnicians();

        if (!technicians || technicians.length === 0) {
            logger.warn("No technicians found in database");
            return res.status(404).json({ 
                success: false,
                message: "No technicians found" 
            });
        }

        logger.info(`Retrieved ${technicians.length} technicians`);
        res.status(200).json({
            success: true,
            message: "Technicians retrieved successfully",
            data: technicians,
        });
    } catch (error) {
        logger.error(`Error getting all technicians: ${error.message}`);
        res.status(500).json({ 
            success: false,
            message: "Failed to retrieve technicians",
            error: error.message 
        });
    }
}

async function getTechnicianById(req, res){
    try{
        const technicianId = req.params.id;
        
        if (!technicianId) {
            return res.status(400).json({ 
                success: false,
                message: "Technician ID is required" 
            });
        }

        const technician = await personService.getTechnicianById(technicianId);

        if (!technician) {
            logger.warn(`Technician not found: ${technicianId}`);
            return res.status(404).json({ 
                success: false,
                message: "Technician not found" 
            });
        }

        logger.info(`Technician retrieved: ${technicianId}`);
        res.status(200).json({
            success: true,
            message: "Technician retrieved successfully",
            data: technician,
        });

    }
    catch(error){
        logger.error(`Error getting technician by ID: ${error.message}`);
        res.status(500).json({ 
            success: false,
            message: "Failed to retrieve technician",
            error: error.message 
        });
    }
}



async function updateTechnician(req, res) {
    try {
        const { id } = req.body;
        
        if (!id) {
            return res.status(400).json({ 
                success: false,
                message: "Technician ID is required" 
            });
        }

        const updatedTechnician = await personService.updateTechnician(req.body);

        if (!updatedTechnician) {
            logger.warn(`Technician not found for update: ${id}`);
            return res.status(404).json({ 
                success: false,
                message: "Technician not found" 
            });
        }

        logger.info(`Technician updated: ${id}`);
        res.status(200).json({
            success: true,
            message: "Technician updated successfully",
            data: updatedTechnician,
        });
    } catch (error) {
        logger.error(`Error updating technician: ${error.message}`);
        res.status(500).json({ 
            success: false,
            message: "Failed to update technician",
            error: error.message 
        });
    }
}

// retiring him, and blocking his account
async function deleteTechnician(req, res) {
    try {
        const technicianId = req.params.id;
        
        if (!technicianId) {
            return res.status(400).json({ 
                success: false,
                message: "Technician ID is required" 
            });
        }

        const deletedTechnician = await personService.deleteTechnician(technicianId);

        if (!deletedTechnician) {
            logger.warn(`Technician not found for deletion: ${technicianId}`);
            return res.status(404).json({ 
                success: false,
                message: "Technician not found" 
            });
        }

        logger.info(`Technician deleted: ${technicianId}`);
        res.status(200).json({
            success: true,
            message: "Technician deleted successfully"
        });
    } catch (error) {
        logger.error(`Error deleting technician: ${error.message}`);
        res.status(500).json({ 
            success: false,
            message: "Failed to delete technician",
            error: error.message 
        });
    }
}

module.exports = {
    createTechnician,
    getAllTechnicians,
    updateTechnician,
    deleteTechnician,
    getTechnicianById,
};