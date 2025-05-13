const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

async function main() {
    console.log("Seeding database...");

    // Create roles
    console.log("Creating roles...");
    const roles = [{ name: "ADMIN" }, { name: "TECHNICIAN" }, { name: "USER" }];

    for (const role of roles) {
        await prisma.role.upsert({
            where: { name: role.name },
            update: {},
            create: role,
        });
    }

    // Create user accounts
    console.log("Creating user accounts...");

    // Admin user
    const adminHashedPassword = await bcrypt.hash("admin123", 10);
    const adminUser = await prisma.userAccount.upsert({
        where: { email: "admin@example.com" },
        update: {},
        create: {
            email: "admin@example.com",
            passwordHash: adminHashedPassword,
            role_id: 1, // Admin role
        },
    });

    // Technician user
    const techHashedPassword = await bcrypt.hash("tech123", 10);
    const techUser = await prisma.userAccount.upsert({
        where: { email: "tech@example.com" },
        update: {},
        create: {
            email: "tech@example.com",
            passwordHash: techHashedPassword,
            role_id: 2, // Technician role
        },
    });

    // Regular user
    const userHashedPassword = await bcrypt.hash("user123", 10);
    const regularUser = await prisma.userAccount.upsert({
        where: { email: "user@example.com" },
        update: {},
        create: {
            email: "user@example.com",
            passwordHash: userHashedPassword,
            role_id: 3, // User role
        },
    });

    // Create person record ONLY for technician (since ADMIN and USER roles can't have person accounts)
    console.log("Creating technician person record...");
    await prisma.person.upsert({
        where: { userAccountId: techUser.user_id },
        update: {},
        create: {
            fullName: "Tech Support",
            email: "tech@example.com",
            phoneNumber: "555-987-6543",
            department: "IT Support",
            userAccountId: techUser.user_id,
            isTechnician: true, // All persons are technicians
            updatedAt: new Date(),
        },
    });

    // Create equipment types
    console.log("Creating equipment types...");
    const equipmentTypes = [
        { type_name: "Laptop", category: "Computing Equipment" },
        { type_name: "Desktop", category: "Computing Equipment" },
        { type_name: "Printer", category: "Office Equipment" },
        { type_name: "Projector", category: "Presentation Equipment" },
        { type_name: "Server", category: "Network Equipment" },
    ];

    for (const type of equipmentTypes) {
        await prisma.equipment_types.upsert({
            where: { type_name: type.type_name },
            update: {},
            create: type,
        });
    }

    // Create locations
    console.log("Creating locations...");
    const locations = [
        { name: "Main Office" },
        { name: "IT Department" },
        { name: "Meeting Room A" },
        { name: "Reception" },
        { name: "Data Center" },
    ];

    for (const location of locations) {
        await prisma.location.upsert({
            where: { name: location.name },
            update: {},
            create: location,
        });
    }

    // Get the created types and locations for reference
    const laptopType = await prisma.equipment_types.findUnique({
        where: { type_name: "Laptop" },
    });

    const printerType = await prisma.equipment_types.findUnique({
        where: { type_name: "Printer" },
    });

    const mainOffice = await prisma.location.findUnique({
        where: { name: "Main Office" },
    });

    const itDepartment = await prisma.location.findUnique({
        where: { name: "IT Department" },
    });

    // Create equipment
    console.log("Creating equipment...");
    const equipment = [
        {
            inventory_code: "LT-001",
            status: "IN_SERVICE",
            type_id: laptopType.type_id,
            location_id: mainOffice.location_id,
            acquisition_date: new Date("2023-01-15"),
            commission_date: new Date("2023-01-20"),
        },
        {
            inventory_code: "PR-001",
            status: "OUT_OF_SERVICE",
            type_id: printerType.type_id,
            location_id: itDepartment.location_id,
            acquisition_date: new Date("2022-06-10"),
            commission_date: new Date("2022-06-15"),
        },
    ];

    for (const item of equipment) {
        await prisma.equipment.upsert({
            where: { inventory_code: item.inventory_code },
            update: {},
            create: item,
        });
    }

    // Get the created equipment for reference
    const printer = await prisma.equipment.findUnique({
        where: { inventory_code: "PR-001" },
    });

    // Get the technician person
    const techPerson = await prisma.person.findUnique({
        where: { userAccountId: techUser.user_id },
    });

    // Create an intervention reported by a regular user and assigned to the technician
    console.log("Creating sample intervention...");
    const intervention = await prisma.intervention.create({
        data: {
            description: "Printer is not working properly. Paper jam issues.",
            priority: "MEDIUM",
            status: "IN_PROGRESS",
            equipment_id: printer.equipment_id,
            locationId: itDepartment.location_id,
            reportedByUserId: regularUser.user_id, // Regular user reports the issue
            assignedToId: techPerson.person_id, // Assigned to technician
        },
    });

    // Add intervention history
    await prisma.intervention_history.create({
        data: {
            intervention_id: intervention.intervention_id,
            action: "ASSIGNED",
            notes: `Assigned to ${techPerson.fullName}`,
            logged_by_id: techPerson.person_id,
            user_account_id: adminUser.user_id,
        },
    });

    console.log("Database seeded successfully!");
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error("Error seeding database:", e);
        await prisma.$disconnect();
        process.exit(1);
    });
