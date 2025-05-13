// src/features/interventions/intervention.service.js
const {
    PrismaClient,
    InterventionStatus,
    InterventionType,
    InterventionPriority,
    EquipmentStatus,
    Role,
} = require("@prisma/client");
const prisma = new PrismaClient();
const logger = require("../../utils/logger");
const {
    sendNotificationToAdmins,
} = require("../notifications/notifications.service");
const { sendNotificationToTechnician } = require("../notifications/notifications.service");

// Get all interventions
// Update getAllInterventions function
async function getAllInterventions() {
    return await prisma.intervention.findMany({
        where:{
            type: InterventionType.CORRECTIVE,
        },
        include: {
            reportedBy: true,
            assignees: {
                include: {
                    person: true,
                },
            },
            equipment: true,
            location: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
}

// Get intervention by ID
async function getInterventionById(interventionId) {
    return await prisma.intervention.findUnique({
        where: {
            id: parseInt(interventionId),
        },
        include: {
            reportedBy: true,
            assignees: {
                include: {
                    person: true,
                },
            },
            equipment: true,
            location: true,
            history: {
                include: {
                    loggedBy: true,
                },
                orderBy: {
                    loggedAt: "desc",
                },
            },
        },
    });
}

async function getPlannedInterventions() {
    return await prisma.intervention.findMany({
        where: {
            type: InterventionType.PREVENTIVE,
        },
        include: {

            reportedBy: true,
            assignees: {
                include: {
                    person: true,
                },
            },
            equipment: true,
            location: true,
        }
    })
}

// Create an intervention
async function createIntervention(data) {
    // Validate required fields
    if (!data.description || !data.locationId) {
        throw new Error(
            "Required fields are missing (description, locationId)"
        );
    }
    // Create intervention and update equipment status in a transaction
    const intervention = await prisma.$transaction(
        async (tx) => {
            // Create the intervention
            const intervention = await tx.intervention.create({
                data: {
                    description: data.description,
                    type: InterventionType.CORRECTIVE,
                    recurrenceInterval: 0,
                    isRecurring: false,
                    priority: data.priority || InterventionPriority.MEDIUM,
                    status: InterventionStatus.PENDING,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    plannedAt: null,
                    location: {
                        connect: { id: parseInt(data.locationId) },
                    },
                    equipment: data.equipmentId
                        ? {
                              connect: {
                                  id: parseInt(data.equipmentId),
                              },
                          }
                        : undefined,
                    reportedBy: {
                        connect: { id: data.reportedById },
                    },
                },
                include: {
                    location: true,
                    equipment: true,
                },
            });
            return intervention;
        },
        {
            timeout: 30000,
        }
    );
    try {
        const message = `${intervention.description} at ${intervention.location?.name || "Unknown location"}`;
        await sendNotificationToAdmins(message, intervention);
    } catch (error) {
        // Log but don't fail the operation if notification fails
        logger.error(`Failed to send admin notification: ${error.message}`);
    }
    return intervention;
}

// Planify intervention
async function planifyIntervention(data) {
    // Validate required fields
    if (!data.description || !data.locationId) {
        throw new Error(
            "Required fields are missing (description, locationId)"
        );
    }

    if (!data.plannedAt) {
        throw new Error("Planned date is required");
    }

    if (data.isRecurring === undefined) {
        throw new Error("Recurrence flag is required");
    }

    // Only validate recurrenceInterval if isRecurring is true
    if (data.isRecurring && !data.recurrenceInterval) {
        throw new Error(
            "Recurrence interval is required for recurring interventions"
        );
    }

    // Validate assignees is an array
    if (!Array.isArray(data.assignees) || data.assignees.length === 0) {
        throw new Error("At least one technician must be assigned");
    }

    try {
        return await prisma.$transaction(async (tx) => {
            // 1. Create the intervention WITHOUT assignees
            const intervention = await tx.intervention.create({
                data: {
                    description: data.description,
                    type: InterventionType.PREVENTIVE,
                    recurrenceInterval: data.isRecurring
                        ? data.recurrenceInterval
                        : 0,
                    isRecurring: data.isRecurring,
                    priority: data.priority || InterventionPriority.MEDIUM,
                    status: InterventionStatus.PENDING,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    plannedAt: new Date(data.plannedAt),
                    location: {
                        connect: { id: parseInt(data.locationId) },
                    },
                    equipment: data.equipmentId
                        ? { connect: { id: parseInt(data.equipmentId) } }
                        : undefined,
                    reportedBy: {
                        connect: { id: data.adminId },
                    }, // Use direct ID instead of connect
                },
            });

            // 2. Create assignment records manually for each technician
            for (const assigneeId of data.assignees) {
                await tx.interventionAssignment.create({
                    data: {
                        interventionId: intervention.id,
                        personId: parseInt(assigneeId),
                    },
                });
            }

            // 3. Handle equipment update
            if (data.equipmentId) {
                await tx.equipment.update({
                    where: { id: parseInt(data.equipmentId) },
                    data: {
                        nextScheduledMaintenance: new Date(data.plannedAt),
                        updatedAt: new Date(),
                    },
                });
            }

            // 4. Add history entry
            // await tx.interventionHistory.create({
            //     data: {
            //         interventionId: intervention.id,
            //         action: "PLANNED",
            //         notes: `Preventive maintenance planned for ${new Date(
            //             data.plannedAt
            //         ).toLocaleDateString()}`,
            //         loggedById: data.adminId,
            //         userAccountId: data.adminId,
            //     },
            // });

            // 5. Return the full intervention with all related data
            return await tx.intervention.findUnique({
                where: { id: intervention.id },
                include: {
                    location: true,
                    equipment: true,
                    assignees: {
                        include: { person: true },
                    },
                    reportedBy: true,
                },
            });
        });
    } catch (error) {
        logger.error(`Error planning intervention: ${error.message}`);
        throw new Error(`Failed to plan intervention: ${error.message}`);
    }
}

async function updateIntervention(interventionId, data) {
    const updateData = {};

    if (data.description) updateData.description = data.description;
    if (data.priority) updateData.priority = data.priority;
    if (data.status) updateData.status = data.status;
    if (data.locationId) updateData.locationId = parseInt(data.locationId);
    if (data.equipmentId !== undefined) {
        updateData.equipmentId = data.equipmentId
            ? parseInt(data.equipmentId)
            : null;
    }
    updateData.updatedAt = new Date();

    // Fetch the intervention if needed
    let existingIntervention = null;
    if (
        (data.status === InterventionStatus.APPROVED ||
            data.status === InterventionStatus.COMPLETED) &&
        !data.equipmentId
    ) {
        existingIntervention = await prisma.intervention.findUnique({
            where: { id: interventionId },
            select: { equipmentId: true },
        });
    }

    const equipmentId = data.equipmentId
        ? parseInt(data.equipmentId)
        : existingIntervention?.equipmentId;

    if (data.status === InterventionStatus.APPROVED && equipmentId) {
        await prisma.equipment.update({
            where: { id: equipmentId },
            data: {
                status: EquipmentStatus.OUT_OF_SERVICE,
                updatedAt: new Date(),
            },
        });
    }

    if (data.status === InterventionStatus.COMPLETED && equipmentId) {
        await prisma.equipment.update({
            where: { id: equipmentId },
            data: { status: EquipmentStatus.IN_SERVICE, updatedAt: new Date() },
        });
    }

    if (data.status === InterventionStatus.CANCELLED) {
        updateData.cancelledAt = new Date();
    }
    if (data.status === InterventionStatus.DENIED) {
        updateData.deniedAt = new Date();
    }
    if (data.status === InterventionStatus.APPROVED) {
        updateData.approvedAt = new Date();
    }
    return await prisma.intervention.update({
        where: { id: interventionId },
        data: updateData,
        include: {
            equipment: true,
            location: true,
        },
    });
}

// Delete intervention
async function deleteIntervention(interventionId, userRole) {
    const intervention = await prisma.intervention.findUnique({
        where: { id: parseInt(interventionId) },
    });

    if (!intervention) {
        throw new Error("Intervention not found");
    }

    if (intervention.status !== InterventionStatus.PENDING) {
        throw new Error("Only pending interventions can be deleted");
    } else {
        if (userRole === Role.ADMIN) {
            return await prisma.intervention.update({
                where: { id: parseInt(interventionId) },
                data: {
                    status: InterventionStatus.CANCELLED,
                    cancelledAt: new Date(),
                },
            });
        }
        if (userRole === Role.TECHNICIAN) {
            return await prisma.intervention.update({
                where: { id: parseInt(interventionId) },
                data: {
                    status: InterventionStatus.DENIED,
                    deniedAt: new Date(),
                },
            });
        }
    }
}

async function assignIntervention(interventionIds, technicianIds, adminUserId) {
    // Validate input
    if (!Array.isArray(interventionIds) || interventionIds.length === 0) {
        throw new Error("Must provide at least one intervention ID");
    }

    if (!Array.isArray(technicianIds) || technicianIds.length === 0) {
        throw new Error("Must provide at least one technician ID");
    }

    // Verify all persons exist
    const persons = await prisma.person.findMany({
        where: {
            id: {
                in: technicianIds.map((id) => parseInt(id)),
            },
        },
    });

    if (persons.length !== technicianIds.length) {
        throw new Error("One or more technicians not found");
    }

    // Verify all interventions exist
    const interventions = await prisma.intervention.findMany({
        where: {
            id: {
                in: interventionIds.map((id) => parseInt(id)),
            },
        },
    });

    if (interventions.length !== interventionIds.length) {
        throw new Error("One or more interventions not found");
    }

    // Process each intervention
    const results = [];

    for (const interventionId of interventionIds) {
        // Update the intervention status and create assignments in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Update intervention status
            const intervention = await tx.intervention.update({
                where: { id: parseInt(interventionId) },
                data: {
                    status: InterventionStatus.IN_PROGRESS,
                },
                include: {
                    location: true,
                }
            });

            // Create assignments for each person (if they don't exist already)
            for (const personId of technicianIds) {
                await tx.interventionAssignment.upsert({
                    where: {
                        interventionId_personId: {
                            interventionId: parseInt(interventionId),
                            personId: parseInt(personId),
                        },
                    },
                    update: {}, // No updates if it exists
                    create: {
                        interventionId: parseInt(interventionId),
                        personId: parseInt(personId),
                    },
                });
                // we send them a notification as well
                await sendNotificationToTechnician(personId, intervention.location.name, intervention.description);
            }

            // Get the complete intervention with assignments
            return await tx.intervention.findUnique({
                where: { id: parseInt(interventionId) },
                include: {
                    location: true,
                    equipment: true,
                    reportedBy: true,
                    assignees: {
                        include: {
                            person: true,
                        },
                    },
                },
            });
        });

        results.push(result);

        // Add history entries for each assignment
        for (const person of persons) {
            await prisma.interventionHistory.create({
                data: {
                    interventionId: parseInt(interventionId),
                    action: "ASSIGNED",
                    notes: `Assigned to ${person.firstName} ${person.lastName} || person.id}`,
                    loggedById: person.id,
                    userAccountId: adminUserId,
                },
            });
        }
    }

    return results;
}

// Pause an intervention
async function pauseIntervention(interventionId, userId) {
    // a transaction is needed to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
        // we can pause an intervention only if its current status is IN_PROGRESS
        const intervention = await tx.intervention.findUnique({
            where: { id: parseInt(interventionId) },
            select: { status: true },
        });
        if (intervention.status !== InterventionStatus.IN_PROGRESS) {
            throw new Error("Intervention must be in progress to be paused");
        }
        // Update the intervention status to PAUSED
        const updatedIntervention = await tx.intervention.update({
            where: { id: parseInt(interventionId) },
            data: {
                status: InterventionStatus.PAUSED,
                updatedAt: new Date(),
            },
            include: {
                location: true,
                equipment: true,
                reportedBy: true,
                assignees: {
                    include: {
                        person: true,
                    },
                },
                pauses: true,
            },
        });

        await tx.pause.create({
            data: {
                interventionId: parseInt(interventionId),
                pausedAt: new Date(),
            },
        });

        // getting the personId
        const user = await tx.userAccount.findUnique({
            where: { id: userId },
            include: { person: true },
        });

        const personId = user.person.id;
        // Create a history entry for the pause action
        await tx.interventionHistory.create({
            data: {
                interventionId: parseInt(interventionId),
                action: "PAUSED",
                loggedById: parseInt(personId),
                userAccountId: userId,
            },
        });

        return updatedIntervention;
    });
}

// Resume an intervention
async function resumeIntervention(interventionId, userId) {
    // First, check if the intervention is currently paused
    const intervention = await prisma.intervention.findUnique({
        where: { id: parseInt(interventionId) },
        select: { status: true },
    });

    if (intervention.status !== InterventionStatus.PAUSED) {
        throw new Error("Intervention must be paused to be resumed");
    }

    // Get the user's person record before starting the transaction
    const user = await prisma.userAccount.findUnique({
        where: { id: userId },
        include: { person: true },
    });

    if (!user || !user.person) {
        throw new Error("User not found or has no associated person record");
    }

    const personId = user.person.id;

    // Find the most recent pause record for this intervention
    const pauseRecord = await prisma.pause.findFirst({
        where: {
            interventionId: parseInt(interventionId),
            resumedAt: null, // Only get pauses that haven't been resumed
        },
        orderBy: { pausedAt: "desc" },
    });

    if (!pauseRecord) {
        throw new Error("No active pause record found for this intervention");
    }

    // Now perform the transaction
    return await prisma.$transaction(async (tx) => {
        // Update intervention status
        const updatedIntervention = await tx.intervention.update({
            where: { id: parseInt(interventionId) },
            data: {
                status: InterventionStatus.IN_PROGRESS,
                updatedAt: new Date(),
            },
            include: {
                location: true,
                equipment: true,
                reportedBy: true,
                assignees: {
                    include: {
                        person: true,
                    },
                },
            },
        });

        // Update the specific pause record using its ID
        await tx.pause.update({
            where: { id: pauseRecord.id }, // Use the pause record's ID
            data: {
                resumedAt: new Date(),
            },
        });

        // Create history entry
        await tx.interventionHistory.create({
            data: {
                interventionId: parseInt(interventionId),
                action: "RESUMED",
                loggedById: personId,
                userAccountId: userId,
            },
        });

        return updatedIntervention;
    });
}
// Resolve an intervention
async function resolveIntervention(interventionId, resolutionData, userId) {
    const { equipmentId, action, partsUsed, notes } = resolutionData;

    // Get the complete intervention with assignees and all needed fields
    const intervention = await prisma.intervention.findUnique({
        where: { id: parseInt(interventionId) },
        include: {
            assignees: {
                include: {
                    person: true
                }
            },
            location: true,
            equipment: true,
            reportedBy: true,
        },
    });

    if (!intervention) {
        throw new Error("Intervention not found");
    }

    // Get user's person record and role
    const user = await prisma.userAccount.findUnique({
        where: { id: userId },
        include: { person: true },
    });
    
    // Check permission: either admin or one of the assigned persons
    const isAdmin = user.role === Role.ADMIN;

    // Check if user's person is among the assignees
    const isAssignedPerson =
        user.person &&
        intervention.assignees.some(
            (assignment) => assignment.personId === user.person.id
        );

    if (!isAdmin && !isAssignedPerson) {
        throw new Error(
            "Only administrators or assigned persons can resolve this intervention"
        );
    }

    // Start a transaction
    return await prisma.$transaction(async (tx) => {
        // Update the intervention
        const updatedIntervention = await tx.intervention.update({
            where: { id: interventionId },
            data: {
                status: InterventionStatus.COMPLETED,
                partsUsed: partsUsed || null,
                resolutionSummary: action || null,
                resolvedAt: new Date(),
                updatedAt: new Date(),
            },
            include: {
                equipment: true,
                location: true,
                reportedBy: true,
                assignees: {
                    include: {
                        person: true,
                    },
                },
            },
        });

        // If there's equipment, update its status
        if (equipmentId) {
            await tx.equipment.update({
                where: { id: parseInt(equipmentId) },
                data: {
                    status: EquipmentStatus.IN_SERVICE,
                    updatedAt: new Date(),
                },
            });
        }

        // Determine who logged this resolution
        const loggedById = user.person?.id;

        if (!loggedById) {
            throw new Error("No person profile found for this user");
        }

        // Create history entry
        const history = await tx.interventionHistory.create({
            data: {
                interventionId,
                action: action || "RESOLVED",
                partsUsed,
                notes,
                loggedById: loggedById,
                userAccountId: userId,
            },
        });
        
        // Handle recurring interventions
        let newIntervention = null;
        if (intervention.isRecurring && intervention.recurrenceInterval > 0) {
            // Calculate the next planned date based on the original plannedAt date
            // This prevents date drift from actual completion dates
            const nextPlannedDate = new Date(intervention.plannedAt);
            nextPlannedDate.setDate(nextPlannedDate.getDate() + intervention.recurrenceInterval);
            
            // Create a new pending intervention
            newIntervention = await tx.intervention.create({
                data: {
                    description: intervention.description,
                    type: intervention.type,
                    recurrenceInterval: intervention.recurrenceInterval,
                    isRecurring: intervention.isRecurring,
                    priority: intervention.priority,
                    status: InterventionStatus.PENDING,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    plannedAt: nextPlannedDate,
                    locationId: intervention.locationId,
                    equipmentId: intervention.equipmentId,
                    reportedById: intervention.reportedById,
                },
            });
            
            // Copy all the assignees to the new intervention
            for (const assignee of intervention.assignees) {
                await tx.interventionAssignment.create({
                    data: {
                        interventionId: newIntervention.id,
                        personId: assignee.personId,
                    },
                });
            }
            
            // If there's equipment, update the next scheduled maintenance date
            if (intervention.equipmentId) {
                await tx.equipment.update({
                    where: { id: intervention.equipmentId },
                    data: {
                        nextScheduledMaintenance: nextPlannedDate,
                        updatedAt: new Date(),
                    },
                });
            }
            
            // Add history entry for the creation of the recurring intervention
            await tx.interventionHistory.create({
                data: {
                    interventionId: newIntervention.id,
                    action: "CREATED_RECURRING",
                    notes: `Auto-created from recurring intervention #${intervention.id}`,
                    loggedById: loggedById,
                    userAccountId: userId,
                },
            });
            
            // Get the complete new intervention with all associations
            newIntervention = await tx.intervention.findUnique({
                where: { id: newIntervention.id },
                include: {
                    equipment: true,
                    location: true,
                    reportedBy: true,
                    assignees: {
                        include: {
                            person: true,
                        },
                    },
                },
            });
            
            logger.info(`Created new recurring intervention #${newIntervention.id} scheduled for ${nextPlannedDate}`);
        }

        return { 
            intervention: updatedIntervention, 
            history
        };
    });
}

// Get interventions assigned to a user
async function getMyAssignedInterventions(userId) {
    // First get the person_id associated with this user account
    const person = await prisma.person.findUnique({
        where: {
            userAccountId: userId,
        },
    });

    if (!person) {
        throw new Error("No person profile found for this user");
    }

    // Get all interventions assigned to this person
    return await prisma.intervention.findMany({
        where: {
            assignees: {
                some: {
                    personId: person.id,
                },
            },
        },
        include: {
            location: true,
            equipment: true,
            reportedBy: true,
            assignees: { include: { person: true } },
        },
        orderBy: {
            createdAt: "desc",
        },
    });
}

// Get interventions reported by a user
async function getMyReportedInterventions(userId) {
    return await prisma.intervention.findMany({
        where: {
            reportedById: userId,
        },
        include: {
            location: true,
            equipment: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
}

module.exports = {
    getAllInterventions,
    getInterventionById,
    createIntervention,
    updateIntervention,
    planifyIntervention,
    deleteIntervention,
    assignIntervention,
    resolveIntervention,
    getMyAssignedInterventions,
    getMyReportedInterventions,
    pauseIntervention,
    resumeIntervention,
    getPlannedInterventions,
};
