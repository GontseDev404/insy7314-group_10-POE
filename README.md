# Secure Employee International Payments Portal  
**Developed by: Group 10**

---

## Project Overview
This project is a secure employee-only international payments portal built using React for the frontend and Node.js with Express for the backend.  

The system enables authorized employees to:
- Log in securely using pre-created accounts with hashed and salted passwords
- Submit international payments with validated IBAN, SWIFT, and currency inputs
- View a transaction dashboard listing all processed payments

**Note:** User registration is disabled. All users are pre-created by administrators. See the "Static User Seeding" section below.

All backend traffic is served over HTTPS, and comprehensive security measures are implemented to protect user data and communication.

---

## Core Technologies

| Layer | Technologies Used |
|--------|--------------------|
| Frontend | React, Vite, CSS |
| Backend | Node.js, Express.js, SQLite3 |
| Security | bcrypt, helmet, express-validator, csurf, express-rate-limit |
| Networking | HTTPS (SSL Certificates) |
| CI/CD | CircleCI with SonarQube |
| Version Control | Git, GitHub |

---

## Security Features Implemented

### Password Security
- **Password Hashing & Salting**: Uses bcrypt with 12 salt rounds to securely hash and store user passwords
- **No Plain Text Storage**: All passwords are hashed before storage in the database

### Input Validation (Whitelisting)
- **RegEx Pattern Validation**: All inputs are validated using RegEx patterns through express-validator
- **Patterns Defined**: Email, full name, password, beneficiary name, SWIFT code, IBAN, amount, currency, and reference fields all use whitelist patterns
- **See**: `SecurePaymentsAPI/security.js` for all validation patterns

### SSL/HTTPS Traffic
- **All Traffic Encrypted**: Backend served securely using self-signed SSL certificates
- **HTTPS Only**: All API endpoints require HTTPS (port 8443)
- **Certificate Setup**: See "How to Run the Project Locally" section below

### Attack Protection

| Attack Type | Protection Method | Status |
|------------|------------------|--------|
| **XSS (Cross-Site Scripting)** | Helmet middleware with XSS filter and content-type-options | ✅ Protected |
| **SQL Injection** | Parameterized queries in all database operations | ✅ Protected |
| **CSRF (Cross-Site Request Forgery)** | csurf middleware with token validation on all POST requests | ✅ Protected |
| **Brute Force** | express-rate-limit (200 requests per 10 minutes per IP) | ✅ Protected |
| **Clickjacking** | Helmet X-Frame-Options header | ✅ Protected |
| **MIME Sniffing** | Helmet content-type-options header | ✅ Protected |

### Additional Security Measures
- **CORS Whitelisting**: Only trusted origins are allowed access to the API
- **JWT Authentication**: Secure sessions handled with JSON Web Tokens and HTTP-only cookies
- **Security Event Logging**: All login attempts and payment creations are logged
- **Input Sanitization**: All inputs are trimmed and sanitized before processing

---

## How to Run the Project Locally

### Prerequisites
- Node.js (v18 or higher) installed
- npm package manager
- OpenSSL (for certificate generation)

### Step 1: Configure Environment Variables
Create a `.env` file in the `SecurePaymentsAPI` directory:

```bash
cd SecurePaymentsAPI
# Create .env file with the following content:
JWT_SECRET=your-strong-secret-key-here
FRONTEND_URL=https://localhost:5173
PORT=8443
```

**Important:** Generate a strong JWT_SECRET. You can use:
```bash
openssl rand -base64 32
```

### Step 2: Generate SSL Certificates
```bash
cd SecurePaymentsAPI
npm run make:certs
```

This creates self-signed certificates in the `certs/` directory for HTTPS.

### Step 3: Seed Static Users
**Important:** Before running the application, you must seed the database with employee users:

```bash
cd SecurePaymentsAPI
npm install
npm run seed
```

This will create 5 sample employee users. Default password for all users: `Employee@123`

**Sample Users:**
- Email: `john.doe@company.com` | Password: `Employee@123`
- Email: `jane.smith@company.com` | Password: `Employee@123`
- Email: `michael.johnson@company.com` | Password: `Employee@123`
- Email: `emma.wilson@company.com` | Password: `Employee@123`
- Email: `david.brown@company.com` | Password: `Employee@123`

**Note:** The seed script will skip users that already exist, so you can run it multiple times safely.

### Step 4: Run the Backend
```bash
cd SecurePaymentsAPI
npm run dev
```

Once started, the backend will be available at:
**https://localhost:8443**

### Step 5: Run the Frontend
Open a new terminal:
```bash
cd SecurePaymentsFrontend
npm install
npm run dev
```

Once started, the frontend will be available at:
**https://localhost:5173**

---

## Static User Seeding

### Overview
User registration is disabled for security. All employee accounts must be pre-created using the seeding script.

### Seeding Script
The `seed.js` script (`SecurePaymentsAPI/seed.js`) automatically:
- Hashes passwords using bcrypt (12 salt rounds)
- Inserts users into the database
- Skips users that already exist
- Provides feedback on created users

### Running the Seed Script
```bash
cd SecurePaymentsAPI
npm run seed
```

### Adding New Employees
To add new employees, edit `SecurePaymentsAPI/seed.js` and add new entries to the `employees` array:

```javascript
{
    email: "new.employee@company.com",
    fullName: "New Employee",
    password: "Employee@123"
}
```

Then run `npm run seed` again.

### SQL Seed File
A reference SQL file (`SecurePaymentsAPI/seed.sql`) is provided for documentation purposes. The actual seeding is done via the JavaScript script to ensure proper password hashing.

---

## DevSecOps Pipeline

This project uses **CircleCI** for continuous integration and **SonarQube** for code quality analysis.

### CircleCI Pipeline

The CircleCI pipeline (`.circleci/config.yml`) performs the following checks:

1. **Backend Validation**
   - Syntax validation of all JavaScript files
   - Security audit (npm audit) for high/critical vulnerabilities
   - Code quality checks

2. **Frontend Validation**
   - ESLint code quality checks
   - Frontend build verification
   - Security audit (npm audit) for high/critical vulnerabilities

3. **SonarQube Analysis**
   - Code quality scanning for hotspots
   - Code smell detection
   - Security vulnerability analysis
   - Separate analysis for backend and frontend

### Setting Up CircleCI

1. **Connect GitHub Repository to CircleCI**
   - Go to [CircleCI](https://circleci.com/)
   - Sign in with your GitHub account
   - Click "Add Projects"
   - Select your repository
   - Click "Set Up Project"

2. **Configure Environment Variables**
   In CircleCI project settings, add the following environment variables:
   - `SONAR_TOKEN`: Your SonarCloud token (get from [SonarCloud](https://sonarcloud.io/))

3. **Push to Trigger Pipeline**
   - The pipeline will automatically run on every push to `main` or `master` branch
   - View results in the CircleCI dashboard

### Setting Up SonarQube

#### Option 1: SonarCloud (Recommended - Free Tier Available)

1. **Create SonarCloud Account**
   - Go to [SonarCloud](https://sonarcloud.io/)
   - Sign in with GitHub
   - Create a new organization (free tier available)

2. **Create Projects**
   - Create two projects:
     - `secure-payments-api` (for backend)
     - `secure-payments-frontend` (for frontend)
   - Note the project keys (used in `sonar-project.properties`)

3. **Generate Token**
   - Go to Account > Security
   - Generate a new token
   - Add it as `SONAR_TOKEN` in CircleCI environment variables

4. **Configure Project Properties**
   - Backend: `SecurePaymentsAPI/sonar-project.properties`
   - Frontend: `SecurePaymentsFrontend/sonar-project.properties`
   - Ensure project keys match your SonarCloud projects

#### Option 2: Self-Hosted SonarQube

1. **Install SonarQube Server**
   - Follow [SonarQube installation guide](https://docs.sonarqube.org/latest/setup/install-server/)
   - Configure your SonarQube instance

2. **Update Configuration**
   - Update `sonar.host.url` in both `sonar-project.properties` files
   - Configure authentication tokens
   - Update CircleCI config if needed

### Viewing Pipeline Results

**CircleCI:**
- Go to your CircleCI dashboard
- Select your project
- View workflow runs and job status
- Click on any job to see detailed logs

**SonarQube:**
- Go to your SonarCloud/SonarQube instance
- Navigate to your projects
- View code quality metrics, hotspots, and code smells

### Local Testing

To test the pipeline locally before pushing:
- Run `npm audit` in both frontend and backend directories
- Run `npm run lint` in the frontend directory
- Run `npm run build` in the frontend directory
- Run `npm run seed` in the backend directory to verify seeding works

---

## Sample Data for Testing

### Login Credentials
After running the seed script, use these credentials:

**Email:** `john.doe@company.com`  
**Password:** `Employee@123`

### Sample Payment
- **Beneficiary Name:** Olivia Smith
- **SWIFT:** BARCGB22
- **IBAN:** GB29NWBK60161331926819
- **Amount:** 2750.00
- **Currency:** GBP
- **Reference:** Travel Reimbursement

---

## Project Structure

```
insy7314-poe-group-10-1/
├── SecurePaymentsAPI/
│   ├── server.js              # Main Express server
│   ├── db.js                  # Database configuration
│   ├── security.js            # RegEx validation patterns
│   ├── seed.js                # User seeding script
│   ├── seed.sql               # SQL seed reference
│   ├── sonar-project.properties  # SonarQube backend config
│   ├── package.json
│   └── certs/                 # SSL certificates (generated)
├── SecurePaymentsFrontend/
│   ├── src/
│   │   ├── App.jsx            # Main React component
│   │   ├── App.css             # Professional styling
│   │   └── main.jsx
│   ├── sonar-project.properties  # SonarQube frontend config
│   └── package.json
├── .circleci/
│   └── config.yml              # CircleCI pipeline configuration
└── README.md
```

---

## Security Best Practices

### Password Requirements
- Passwords are hashed using bcrypt with 12 salt rounds
- Never store passwords in plain text
- Default passwords should be changed after first login (feature to be implemented)

### Input Validation
- All user inputs are validated using RegEx patterns
- Inputs are sanitized (trimmed, case-adjusted where appropriate)
- Validation rules are defined in `security.js`

### SSL Certificates
- Self-signed certificates are used for development
- For production, use certificates from a trusted Certificate Authority (CA)
- Never commit certificates to version control

### Environment Variables
- Never commit `.env` files
- Use strong, randomly generated secrets
- Rotate secrets regularly in production

---

## Troubleshooting

### Certificate Errors
If you see SSL certificate errors in the browser:
- This is normal for self-signed certificates
- Click "Advanced" and "Proceed to localhost" (or equivalent)
- For production, use proper CA-signed certificates

### Database Errors
If you encounter database errors:
- Ensure SQLite is installed
- Check that the database file has write permissions
- Run the seed script if the database is empty

### Port Conflicts
If ports 8443 or 5173 are already in use:
- Change the port in `.env` (backend) or `vite.config.js` (frontend)
- Update `FRONTEND_URL` in backend `.env` if frontend port changes

---

## License

This project is developed for educational purposes as part of Group 10's assignment.

---

[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/xgXPKfuw)
