import "dotenv/config";
import bcrypt from "bcrypt";
import dbPromise from "./db.js";

const employees = [
    {
        email: "john.doe@company.com",
        fullName: "John Doe",
        password: "Employee@123"
    },
    {
        email: "jane.smith@company.com",
        fullName: "Jane Smith",
        password: "Employee@123"
    },
    {
        email: "michael.johnson@company.com",
        fullName: "Michael Johnson",
        password: "Employee@123"
    },
    {
        email: "emma.wilson@company.com",
        fullName: "Emma Wilson",
        password: "Employee@123"
    },
    {
        email: "david.brown@company.com",
        fullName: "David Brown",
        password: "Employee@123"
    }
];

async function seedUsers() {
    try {
        const db = await dbPromise;
        
        console.log("🌱 Starting user seeding process...\n");
        
        for (const employee of employees) {
            // Check if user already exists
            const existing = await db.get("SELECT * FROM users WHERE email = ?", employee.email);
            
            if (existing) {
                console.log(`⏭️  User ${employee.email} already exists, skipping...`);
                continue;
            }
            
            // Hash password with bcrypt (12 salt rounds)
            const hash = await bcrypt.hash(employee.password, 12);
            
            // Insert user into database
            await db.run(
                "INSERT INTO users (email, full_name, password_hash, created_at) VALUES (?, ?, ?, datetime('now'))",
                employee.email,
                employee.fullName,
                hash
            );
            
            console.log(`✅ Created user: ${employee.email} (${employee.fullName})`);
        }
        
        console.log("\n✨ Seeding completed successfully!");
        console.log("\n📋 Sample login credentials:");
        console.log("   Email: john.doe@company.com");
        console.log("   Password: Employee@123");
        console.log("\n   (All employees use the same default password: Employee@123)");
        
        await db.close();
        process.exit(0);
    } catch (error) {
        console.error("❌ Error seeding users:", error);
        process.exit(1);
    }
}

seedUsers();

