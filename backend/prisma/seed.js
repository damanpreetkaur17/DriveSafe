const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Seed fatigue event types
  const eventTypes = [
    { event_name: "EYE_CLOSURE" },
    { event_name: "YAWNING" },
    { event_name: "DROWSINESS" },
    { event_name: "DISTRACTION" }
  ];

  for (const type of eventTypes) {
    const existing = await prisma.fatigueEventType.findUnique({
      where: { event_name: type.event_name }
    });

    if (!existing) {
      await prisma.fatigueEventType.create({
        data: type
      });
      console.log(`✅ Created event type: ${type.event_name}`);
    } else {
      console.log(`⏭️  Event type already exists: ${type.event_name}`);
    }
  }

  console.log("✅ Seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
