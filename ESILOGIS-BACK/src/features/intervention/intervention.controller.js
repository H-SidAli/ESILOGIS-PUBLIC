const interventionService = require("./intervention.service");
const logger = require("../../utils/logger");

// GET /interventions
async function getInterventions(req, res) {
    try {
        const interventions = await interventionService.getAllInterventions();
        logger.info("Fetched all interventions");
        res.status(200).json({ success: true, data: interventions });
    } catch (err) {
        logger.error("Failed to get interventions:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

// GET /interventions/:id
async function getInterventionById(req, res) {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid ID" });

    try {
        const intervention = await interventionService.getInterventionById(id);
        if (!intervention) {
            return res.status(404).json({ success: false, message: "Intervention not found" });
        }
        logger.info(`Fetched intervention ${id}`);
        res.status(200).json({ success: true, data: intervention });
    } catch (err) {
        logger.error(`Error fetching intervention ${id}:`, err);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

// GET
async function getPlannedInterventions(req, res){
    try{
        const interventions = await interventionService.getPlannedInterventions();
        if (!interventions) {
            return res.status(404).json({ success: false, message: "No planned interventions found" });
        }
        logger.info("Fetched planned interventions");
        res.status(200).json({ success: true, data: interventions });
  
    }catch(err){
        logger.error("Failed to get planned interventions:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

// POST /interventions
async function createIntervention(req, res) {
    const userId = req.user?.id;
    const { description, locationId } = req.body;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!description || !locationId) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    try {
        const data = { ...req.body, reportedById: userId };
        const newIntervention = await interventionService.createIntervention(data);
        logger.info(`Intervention created by ${userId}: ${newIntervention.id}`);
        res.status(201).json({ success: true, data: newIntervention });
    } catch (err) {
        logger.error("Create intervention error:", err);
        res.status(400).json({ success: false, message: err.message });
    }
}

// POST /interventions/planify
async function planifyIntervention(req, res) {
    const adminId = req.user?.id;
    if (!adminId) return res.status(401).json({ success: false, message: "Unauthorized" });

    try {
        const data = { ...req.body, adminId };
        const result = await interventionService.planifyIntervention(data);
        logger.info(`Intervention planned by ${adminId}: ${result.id}`);
        res.status(201).json({ success: true, data: result });
    } catch (err) {
        logger.error("Planify error:", err);
        res.status(400).json({ success: false, message: err.message });
    }
}

// PATCH /interventions/:id
async function updateIntervention(req, res) {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid ID" });

    try {
        const updated = await interventionService.updateIntervention(id, req.body);
        if (!updated) return res.status(404).json({ success: false, message: "Not found" });
        console.log()
        logger.info(`Intervention ${id} updated`);
        res.status(200).json({ success: true, data: updated });
    } catch (err) {
        logger.error(`Update error for ${id}:`, err);
        res.status(400).json({ success: false, message: err.message });
    }
}

// DELETE /interventions/:id
async function deleteIntervention(req, res) {
    const id = parseInt(req.params.id);
    const role = req.user?.role;

    if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid ID" });

    try {
        await interventionService.deleteIntervention(id, role);
        logger.info(`Intervention ${id} deleted by ${role}`);
        res.status(200).json({ success: true, message: "Deleted successfully" });
    } catch (err) {
        logger.error(`Delete error for ${id}:`, err);
        res.status(400).json({ success: false, message: err.message });
    }
}

// POST /interventions/assign
async function assignMultiplePeople(req, res) {
    const { interventionIds, technicianIds } = req.body;
    const adminId = req.user?.id;

    if (!adminId) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!Array.isArray(interventionIds) || !Array.isArray(technicianIds)) {
        return res.status(400).json({ success: false, message: "interventionIds and technicianIds must be arrays" });
    }

    try {
        const result = await interventionService.assignIntervention(interventionIds, technicianIds, adminId);
        logger.info(`Admin ${adminId} assigned technicians`);
        res.status(200).json({ success: true, data: result });
    } catch (err) {
        logger.error("Assignment error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
}

// PATCH /interventions/:id/pause
async function pauseIntervention(req, res) {
    console.log("here");
    const interventionId = parseInt(req.params.id);
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (isNaN(interventionId)) return res.status(400).json({ success: false, message: "Invalid ID" });

    try {
        await interventionService.pauseIntervention(interventionId, userId);
        logger.info(`Intervention ${interventionId} paused by ${userId}`);
        res.status(200).json({ success: true });
    } catch (err) {
        logger.error("Pause error:", err);
        res.status(400).json({ success: false, message: err.message });
    }
}

// PATCH /interventions/:id/resume
async function resumeIntervention(req, res) {
    const id = parseInt(req.params.id);
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid ID" });

    try {
        await interventionService.resumeIntervention(id, userId);
        logger.info(`Intervention ${id} resumed by ${userId}`);
        res.status(200).json({ success: true });
    } catch (err) {
        logger.error("Resume error:", err);
        res.status(400).json({ success: false, message: err.message });
    }
}

// POST /interventions/:id/resolve
async function resolveIntervention(req, res) {
    const id = parseInt(req.params.id);
    const userId = req.user?.id;
    const { action, notes, partsUsed, equipmentId } = req.body;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid ID" });

    try {
        const data = { action, notes, partsUsed, equipmentId };
        const result = await interventionService.resolveIntervention(id, data, userId);
        logger.info(`Resolved intervention ${id} by ${userId}`);
        res.status(200).json({ success: true, data: result });
    } catch (err) {
        const status = err.message.includes("not found") ? 404 : 400;
        logger.error("Resolve error:", err);
        res.status(status).json({ success: false, message: err.message });
    }
}

// GET /interventions/assigned
async function getMyAssignedInterventions(req, res) {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    try {
        const interventions = await interventionService.getMyAssignedInterventions(userId);
        res.status(200).json({ success: true, data: interventions });
    } catch (err) {
        logger.error("Assigned fetch error:", err);
        res.status(500).json({ success: false, message: "Failed to fetch assigned interventions" });
    }
}

// GET /interventions/reported
async function getMyReportedInterventions(req, res) {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    try {
        const interventions = await interventionService.getMyReportedInterventions(userId);
        res.status(200).json({ success: true, data: interventions });
    } catch (err) {
        logger.error("Reported fetch error:", err);
        res.status(500).json({ success: false, message: "Failed to fetch reported interventions" });
    }
}

module.exports = {
    getInterventions,
    getInterventionById,
    createIntervention,
    planifyIntervention,
    updateIntervention,
    deleteIntervention,
    assignMultiplePeople,
    pauseIntervention,
    resumeIntervention,
    resolveIntervention,
    getMyAssignedInterventions,
    getMyReportedInterventions,
    getPlannedInterventions,
};
