const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Create a new location
async function createLocation(data) {
    return await prisma.location.create({
        data: {
            name: data.name,
        },
    });
}

// Get all locations
async function getLocations() {
    return await prisma.location.findMany();
}

// Get a single location by ID
async function getLocationById(locationId) {
    return await prisma.location.findUnique({
        where: {
            id: parseInt(locationId),
        },
    });
}

// Delete a location by ID
async function deleteLocation(locationId) {
    return await prisma.location.delete({
        where: {
            id: parseInt(locationId),
        },
    });
}

// Update location details
async function updateLocation(locationId, data) {
    return await prisma.location.update({
        where: {
            id: parseInt(locationId),
        },
        data: {
            name: data.name,
        },
    });
}

module.exports = {
    createLocation,
    getLocations,
    getLocationById,
    deleteLocation,
    updateLocation,
};