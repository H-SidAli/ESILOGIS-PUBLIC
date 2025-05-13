const equipmentService = require("./equipmentType.service");

//getAllEquipmentTypes
async function getAllEquipmentTypes(req, res) {
    try {
        const equipmentTypes = await equipmentService.getAllEquipmentTypes();
        res.status(200).json(equipmentTypes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

//createEquipmentType;
async function createEquipmentType(req, res) {
    try {
        const { name, category } = req.body;

        //validation
        if (!name || !category) {
            return res.status(400).json({
                message: "Name and category are required",
            });
        }

        const newEquipmentType = await equipmentService.createEquipmentType(
            req.body
        );
        res.status(201).json(newEquipmentType);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

//deleteEquipmentType
async function deleteEquipmentType(req, res) {
    try {
        const equipmentTypeId = req.params.id;

        const deletedEquipmentType = await equipmentService.deleteEquipmentType(
            equipmentTypeId
        );

        if (!deletedEquipmentType) {
            return res.status(404).json({
                message: "Equipment type not found",
            });
        }

        res.status(200).json({
            message: "Equipment type deleted successfully",
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
    getAllEquipmentTypes,
    createEquipmentType,
    deleteEquipmentType,
};