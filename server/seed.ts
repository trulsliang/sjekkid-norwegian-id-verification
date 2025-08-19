import { storage } from "./storage";
import { hashPassword } from "./auth";

async function seedDatabase() {
  console.log("🌱 Seeding database...");

  try {
    // Create default organization
    const testOrg = await storage.createOrganization({
      name: "Test Organization",
      contactEmail: "admin@test.no",
      address: "Test Address 123, Oslo",
      isActive: true,
    });
    console.log("✅ Created test organization:", testOrg.name);

    // Create admin user
    const adminPassword = await hashPassword("admin123");
    const adminUser = await storage.createUser({
      username: "admin",
      password: adminPassword,
      organizationId: testOrg.id,
      role: "admin",
      isActive: true,
    });
    console.log("✅ Created admin user:", adminUser.username);

    // Create organization admin user
    const orgAdminPassword = await hashPassword("orgadmin123");
    const orgAdminUser = await storage.createUser({
      username: "orgadmin",
      password: orgAdminPassword,
      organizationId: testOrg.id,
      role: "org_admin",
      isActive: true,
    });
    console.log("✅ Created org admin user:", orgAdminUser.username);

    // Create regular user
    const userPassword = await hashPassword("user123");
    const regularUser = await storage.createUser({
      username: "user",
      password: userPassword,
      organizationId: testOrg.id,
      role: "user",
      isActive: true,
    });
    console.log("✅ Created regular user:", regularUser.username);

    console.log("\n🎉 Database seeded successfully!");
    console.log("\nAdmin credentials:");
    console.log("Username: admin");
    console.log("Password: admin123");
    console.log("\nOrg Admin credentials:");
    console.log("Username: orgadmin");
    console.log("Password: orgadmin123");
    console.log("\nUser credentials:");
    console.log("Username: user");
    console.log("Password: user123");
    console.log("\nAccess admin panel at: /admin/login");

  } catch (error) {
    console.error("❌ Error seeding database:", error);
  }
}

// Run seed if this file is executed directly
const isMainModule = process.argv[1].endsWith('seed.ts');
if (isMainModule) {
  seedDatabase().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
}

export { seedDatabase };