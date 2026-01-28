import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Delete existing data
  await prisma.reservation.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.create({
    data: {
      email: "admin@brisk.com",
      name: "Admin User",
      password: adminPassword,
      role: "admin",
    },
  });
  console.log("✓ Created admin user:", admin.email);

  // Create customer user
  const customerPassword = await bcrypt.hash("customer123", 10);
  const customer = await prisma.user.create({
    data: {
      email: "customer@brisk.com",
      name: "John Doe",
      password: customerPassword,
      role: "customer",
    },
  });
  console.log("✓ Created customer user:", customer.email);

  // Create products
  const products = [
    {
      name: "Mountain Bike Pro",
      category: "bike",
      size: "M",
      dailyPrice: 45.99,
      description: "High-performance mountain bike with dual suspension",
      imageUrl: null,
    },
    {
      name: "Road Bike Lite",
      category: "bike",
      size: "L",
      dailyPrice: 35.99,
      description: "Lightweight road bike perfect for long distances",
      imageUrl: null,
    },
    {
      name: "City Cruiser",
      category: "bike",
      size: "M",
      dailyPrice: 25.99,
      description: "Comfortable city bike for casual rides",
      imageUrl: null,
    },
    {
      name: "Alpine Ski Set",
      category: "ski",
      size: "170cm",
      dailyPrice: 65.99,
      description: "Professional alpine skis with binding and boots",
      imageUrl: null,
    },
    {
      name: "Cross Country Ski",
      category: "ski",
      size: "165cm",
      dailyPrice: 45.99,
      description: "Lightweight cross-country ski set",
      imageUrl: null,
    },
    {
      name: "Freestyle Ski",
      category: "ski",
      size: "175cm",
      dailyPrice: 55.99,
      description: "Twin-tip freestyle ski for park and street",
      imageUrl: null,
    },
  ];

  const createdProducts = await Promise.all(
    products.map((product) => prisma.product.create({ data: product })),
  );
  console.log(`✓ Created ${createdProducts.length} products`);

  // Create a sample reservation
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 5);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 3);

  const reservation = await prisma.reservation.create({
    data: {
      userId: customer.id,
      productId: createdProducts[0].id,
      startDate,
      endDate,
      status: "active",
    },
  });
  console.log("✓ Created sample reservation");

  console.log("\n✅ Database seeded successfully!");
  console.log("\nDefault credentials:");
  console.log("  Admin:    admin@brisk.com / admin123");
  console.log("  Customer: customer@brisk.com / customer123");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
