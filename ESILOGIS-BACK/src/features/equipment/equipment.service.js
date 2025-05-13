const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Create a new equipment
async function createEquipment(data) {
  if (!data.inventoryCode || !data.locationId || !data.typeId) {
    throw new Error(
      "required fields missing: inventoryCode, locationId, typeId"
    );
  }
  return await prisma.equipment.create({
    data: {
      inventoryCode: data.inventoryCode,
      // Using proper Prisma relations with connect
      location: {
        connect: { id: parseInt(data.locationId) },
      },
      type: {
        connect: { id: parseInt(data.typeId) },
      },
      status: data.status,
      acquisitionDate: new Date(data.acquisitionDate),
      commissionDate: new Date(data.commissionDate),
    },
    include: {
      type: true,
      location: true,
    },
  });
}

// Get all equipment
async function getEquipments() {
  return await prisma.equipment.findMany({
    include: {
      type: true,
      location: true,
    },
  });
}

// Get a single equipment by ID
async function getEquipmentById(equipmentId) {
  return await prisma.equipment.findUnique({
    where: {
      id: parseInt(equipmentId),
    },
    include: {
      type: true,
      location: true,
    },
  });
}

// Delete an equipment by ID
async function deleteEquipment(equipmentId) {
  return await prisma.equipment.delete({
    where: {
      id: parseInt(equipmentId),
    },
  });
}

// Update equipment details
async function updateEquipment(equipmentId, data) {
  // Create an empty update data object
  const updateData = {};
  
  // Only include fields that are explicitly provided
  if (data.status !== undefined) {
    updateData.status = data.status;
  }
  
  // Handle type relationship only if typeId is provided
  if (data.typeId !== undefined) {
    updateData.type = {
      connect: { id: parseInt(data.typeId) },
    };
  }
  
  // Handle date fields only if they are provided
  if (data.acquisitionDate !== undefined) {
    updateData.acquisitionDate = data.acquisitionDate ? new Date(data.acquisitionDate) : null;
  }
  
  if (data.commissionDate !== undefined) {
    updateData.commissionDate = data.commissionDate ? new Date(data.commissionDate) : null;
  }
  
  return await prisma.equipment.update({
    where: {
      id: parseInt(equipmentId),
    },
    data: updateData,
    include: {
      type: true,
    },
  });
}

async function getEquipmentsByLocationId(locationId) {
  return await prisma.equipment.findMany({
    where: {
      locationId: parseInt(locationId),
    },
    include: {
      type: true,
    },
  });
}


module.exports = {
  createEquipment,
  getEquipments,
  getEquipmentById,
  deleteEquipment,
  updateEquipment,
  getEquipmentsByLocationId,
};
