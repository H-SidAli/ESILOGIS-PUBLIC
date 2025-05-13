const { PrismaClient, Role } = require("@prisma/client");
const prisma = new PrismaClient();
const logger = require("../../utils/logger");
const bcrypt = require("bcrypt");

/**
 * Creates a new technician and optionally a user account for them
 */
async function createTechnician(personData) {
    try {
        console.log(personData);
        const result = await prisma.$transaction(async (tx) => {
            // Create the technician record
            const technician = await tx.person.create({
                data: {
                    lastName: personData.lastName,
                    firstName: personData.firstName,
                    phoneNumber: personData.phoneNumber,
                    email: personData.email,
                    ...(personData.departmentId && {
                        department: { connect: { id: personData.departmentId } },
                    }),
                    isTechnician: true,
                    updatedAt: new Date(),
                },
            });

            logger.info(`Created technician record: ${technician.id}`);

            // Optionally create a user account
            let userAccount = null;
            if (personData.createUserAccount && personData.password) {
                // Hash the password
                const passwordHash = await bcrypt.hash(personData.password, 10);

                // Create the user account
                userAccount = await tx.userAccount.create({
                    data: {
                        email: personData.email,
                        passwordHash: passwordHash,
                        role: Role.TECHNICIAN,
                        person: {
                            connect: {
                                id: technician.id,
                            },
                        },
                    },
                });

                logger.info(
                    `Created user account for technician: ${userAccount.id}`
                );

                // Update technician with account ID
                await tx.person.update({
                    where: { id: technician.id },
                    data: { userAccountId: userAccount.id },
                });
            }

            return { technician, userAccount };
        });

        return result;
    } catch (error) {
        logger.error(`Error creating technician: ${error.message}`);
        throw error;
    }
}

/**
 * Gets all active technicians
 */
async function getAllTechnicians() {
    try {
        const technicians = await prisma.person.findMany({
            where: {
                isTechnician: true,
                isRetired: false,
            },
            orderBy: {
                createdAt: "desc",
            },
            include: {
                userAccount: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
                department: true,
                workSchedules: true,
            },
        }); 

        return technicians;
    } catch (error) {
        logger.error(`Error retrieving technicians: ${error.message}`);
        throw error;
    }
}

async function getTechnicianById(technicianId){
    try {
        const technician = await prisma.person.findUnique({
            where: { id: parseInt(technicianId) },
            include: {
                userAccount: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
                department: true,
                workSchedules: true,
            },
        });

        if (!technician) {
            logger.warn(`Technician not found: ${technicianId}`);
            return null;
        }

        return technician;
    } catch (error) {
        logger.error(`Error retrieving technician by ID: ${error.message}`);
        throw error;
    }
}

/**
 * Updates a technician's information
 */
async function updateTechnician(updatedData) {
    try {
        // Check if technician exists
        const existingTechnician = await prisma.person.findUnique({
            where: { id: updatedData.id },
        });

        if (!existingTechnician) {
            logger.warn(`Technician not found for update: ${updatedData.id}`);
            return null;
        }

        const technician = await prisma.person.update({
            where: {
                id: updatedData.id,
            },
            data: {
                department: updatedData.departmentId 
                    ? { connect: { id: updatedData.departmentId } } 
                    : undefined,
                phoneNumber: updatedData.phoneNumber,
                email: updatedData.email,
                firstName: updatedData.firstName,
                lastName: updatedData.lastName,
                updatedAt: new Date(),
            },
        });

        logger.info(`Updated technician: ${technician.id}`);
        return technician;
    } catch (error) {
        logger.error(`Error updating technician: ${error.message}`);
        throw error;
    }
}

/**
 * Soft deletes a technician by marking them as retired
 */
async function deleteTechnician(technicianId) {
    try {
        // Check if technician exists
        const existingTechnician = await prisma.person.findUnique({
            where: { id: technicianId },
        });

        if (!existingTechnician) {
            logger.warn(`Technician not found for deletion: ${technicianId}`);
            return null;
        }

        const technician = await prisma.person.update({
            where: {
                id: technicianId,
            },
            data: {
                isRetired: true,
                updatedAt: new Date(),
                retiredAt: new Date(),
            },
        });

        // blocking his account
        const technicianAccountId = technician.userAccountId;

        const technicianAccount = await prisma.userAccount.update({
            where: {
                id: technicianAccountId,
            },
            data: {
                isBlocked: true,
            },
        });

        logger.info(`Retired technician: ${technician.id}`);
        return technician;
    } catch (error) {
        logger.error(`Error retiring technician: ${error.message}`);
        throw error;
    }
}

module.exports = {
    createTechnician,
    getAllTechnicians,
    updateTechnician,
    deleteTechnician,
    getTechnicianById,
};
