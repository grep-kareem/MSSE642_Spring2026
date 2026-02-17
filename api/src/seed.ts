import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Delete existing data
  await prisma.uploadedFile.deleteMany();
  await prisma.review.deleteMany();
  await prisma.note.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.session.deleteMany();
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

  // Create customer users with weak/common passwords
  const users = [
    {
      email: "customer@brisk.com",
      name: "John Doe",
      password: "customer123",
      role: "customer",
    },
    {
      email: "jane@brisk.com",
      name: "Jane Smith",
      password: "password",
      role: "customer",
    },
    {
      email: "bob@brisk.com",
      name: "Bob Johnson",
      password: "123456",
      role: "customer",
    },
    {
      email: "alice@brisk.com",
      name: "Alice Williams",
      password: "qwerty",
      role: "customer",
    },
    {
      email: "charlie@brisk.com",
      name: "Charlie Brown",
      password: "letmein",
      role: "customer",
    },
    {
      email: "staff@brisk.com",
      name: "Staff Member",
      password: "staff2024",
      role: "staff",
    },
    {
      email: "test@test.com",
      name: "Test Account",
      password: "test",
      role: "customer",
    },
    {
      email: "manager@brisk.com",
      name: "Manager User",
      password: "manager1",
      role: "admin",
    },
  ];

  const createdUsers = [];
  for (const u of users) {
    const hashed = await bcrypt.hash(u.password, 10);
    const user = await prisma.user.create({
      data: {
        email: u.email,
        name: u.name,
        password: hashed,
        role: u.role,
      },
    });
    createdUsers.push(user);
  }
  console.log(`✓ Created ${createdUsers.length} users`);

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
    {
      name: "Electric Mountain Bike",
      category: "bike",
      size: "L",
      dailyPrice: 79.99,
      description: "E-bike with 500W motor and 60-mile range",
      imageUrl: null,
    },
    {
      name: "Kids Bike",
      category: "bike",
      size: "S",
      dailyPrice: 15.99,
      description: "Perfect starter bike for children ages 6-10",
      imageUrl: null,
    },
    {
      name: "Backcountry Ski Touring Set",
      category: "ski",
      size: "180cm",
      dailyPrice: 89.99,
      description: "Lightweight touring skis with climbing skins included",
      imageUrl: null,
    },
    {
      name: "Fat Tire Snow Bike",
      category: "bike",
      size: "L",
      dailyPrice: 55.99,
      description: "Wide-tire bike designed for snow and sand riding",
      imageUrl: null,
    },
  ];

  const createdProducts = await Promise.all(
    products.map((product) => prisma.product.create({ data: product })),
  );
  console.log(`✓ Created ${createdProducts.length} products`);

  // Create multiple reservations
  const now = new Date();
  const reservations = [
    {
      userId: createdUsers[0].id,
      productId: createdProducts[0].id,
      startDate: new Date(now.getTime() + 5 * 86400000),
      endDate: new Date(now.getTime() + 8 * 86400000),
      status: "active",
    },
    {
      userId: createdUsers[1].id,
      productId: createdProducts[3].id,
      startDate: new Date(now.getTime() + 2 * 86400000),
      endDate: new Date(now.getTime() + 5 * 86400000),
      status: "active",
    },
    {
      userId: createdUsers[2].id,
      productId: createdProducts[1].id,
      startDate: new Date(now.getTime() - 10 * 86400000),
      endDate: new Date(now.getTime() - 7 * 86400000),
      status: "completed",
    },
    {
      userId: createdUsers[0].id,
      productId: createdProducts[4].id,
      startDate: new Date(now.getTime() + 10 * 86400000),
      endDate: new Date(now.getTime() + 14 * 86400000),
      status: "active",
    },
    {
      userId: createdUsers[3].id,
      productId: createdProducts[2].id,
      startDate: new Date(now.getTime() - 3 * 86400000),
      endDate: new Date(now.getTime() - 1 * 86400000),
      status: "cancelled",
    },
  ];

  for (const r of reservations) {
    await prisma.reservation.create({ data: r });
  }
  console.log(`✓ Created ${reservations.length} reservations`);

  // Create reviews (some with HTML content for XSS testing)
  const reviews = [
    {
      productId: createdProducts[0].id,
      userId: createdUsers[0].id,
      rating: 5,
      title: "Amazing mountain bike!",
      body: "Rode it on trails all weekend. Suspension was incredible.",
    },
    {
      productId: createdProducts[0].id,
      userId: createdUsers[1].id,
      rating: 4,
      title: "Great bike, minor issue",
      body: "Seat was a bit uncomfortable but overall a <b>great experience</b>!",
    },
    {
      productId: createdProducts[3].id,
      userId: createdUsers[2].id,
      rating: 5,
      title: "Perfect ski set",
      body: "Everything included and ready to go. Will rent again!",
    },
    {
      productId: createdProducts[1].id,
      userId: createdUsers[3].id,
      rating: 3,
      title: "Decent road bike",
      body: "It was okay, gears needed adjustment.",
    },
    {
      productId: createdProducts[2].id,
      userId: createdUsers[0].id,
      rating: 4,
      title: "Fun city rides",
      body: "Perfect for getting around town. Very comfortable.",
    },
  ];

  for (const r of reviews) {
    await prisma.review.create({ data: r });
  }
  console.log(`✓ Created ${reviews.length} reviews`);

  // Create some notes (private and public)
  const notes = [
    {
      userId: createdUsers[0].id,
      title: "My rental preferences",
      content: "I prefer medium-sized bikes. Credit card ending in 4242.",
      isPublic: false,
    },
    {
      userId: admin.id,
      title: "Server Maintenance Notes",
      content:
        "DB backup password: brisk_backup_2024. AWS key: AKIAIOSFODNN7EXAMPLE",
      isPublic: false,
    },
    {
      userId: createdUsers[1].id,
      title: "Great trails nearby",
      content: "Check out Eagle Trail and Bear Creek for mountain biking!",
      isPublic: true,
    },
    {
      userId: createdUsers[2].id,
      title: "Ski trip plan",
      content:
        "Planning to rent skis for the Vail trip. Budget: $500. Hotel WiFi password: vail2024",
      isPublic: false,
    },
  ];

  for (const n of notes) {
    await prisma.note.create({ data: n });
  }
  console.log(`✓ Created ${notes.length} notes`);

  console.log("\n✅ Database seeded successfully!");
  console.log("\nDefault credentials:");
  console.log("  Admin:    admin@brisk.com / admin123");
  console.log("  Admin:    manager@brisk.com / manager1");
  console.log("  Staff:    staff@brisk.com / staff2024");
  console.log("  Customer: customer@brisk.com / customer123");
  console.log("  Customer: jane@brisk.com / password");
  console.log("  Customer: bob@brisk.com / 123456");
  console.log("  Customer: alice@brisk.com / qwerty");
  console.log("  Customer: charlie@brisk.com / letmein");
  console.log("  Customer: test@test.com / test");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
