import "dotenv/config";
import bcrypt from "bcrypt";
import dbPromise from "./db.js";

// Default password from environment variable (for security)
// Set DEFAULT_PASSWORD in .env file or it will prompt
const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD;

if (!DEFAULT_PASSWORD) {
    console.error("❌ ERROR: DEFAULT_PASSWORD environment variable is required!");
    console.error("   Create a .env file with DEFAULT_PASSWORD=your-password");
    console.error("   Or set it when running: DEFAULT_PASSWORD=your-password npm run seed");
    process.exit(1);
}

const employees = [
    {
        email: "john.doe@company.com",
        fullName: "John Doe"
    },
    {
        email: "jane.smith@company.com",
        fullName: "Jane Smith"
    },
    {
        email: "michael.johnson@company.com",
        fullName: "Michael Johnson"
    },
    {
        email: "emma.wilson@company.com",
        fullName: "Emma Wilson"
    },
    {
        email: "david.brown@company.com",
        fullName: "David Brown"
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
            const hash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
            
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
        console.log("\n📋 Users created:");
        employees.forEach(emp => {
            console.log(`   - ${emp.email} (${emp.fullName})`);
        });
        console.log("\n⚠️  Note: All users use the password set in DEFAULT_PASSWORD environment variable");
        console.log("   Change default passwords after first login!");
        
        await db.close();
        process.exit(0);
    } catch (error) {
        console.error("❌ Error seeding users:", error);
        process.exit(1);
    }
}

seedUsers();
