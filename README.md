# Secure Customer International Payments Portal  
**Developed by: Group 10**

---

## Project Overview
This project is a secure customer international payments portal built using React for the frontend and Node.js with Express for the backend.  

The system enables customers to:
- Register and log in securely using hashed and salted passwords.  
- Submit international payments with validated IBAN, SWIFT, and currency inputs.  
- View a transaction dashboard listing all processed payments.

All backend traffic is served over HTTPS, and strong security measures are implemented to protect user data and communication.

---

## Core Technologies

| Layer | Technologies Used |
|--------|--------------------|
| Frontend | React, Vite, CSS |
| Backend | Node.js, Express.js, SQLite3 |
| Security | bcrypt, helmet, express-validator, csurf, express-rate-limit |
| Networking | HTTPS (SSL Certificates) |
| Version Control | Git, GitHub |
| Recording Tool | OBS Studio (for demo video) |

---

## Security Features Implemented

| Security Measure | Description |
|------------------|-------------|
| Password Hashing & Salting | Uses bcrypt to securely hash and store user passwords. |
| Input Validation (Whitelist) | All inputs validated using RegEx patterns through express-validator. |
| HTTPS Traffic | Backend served securely using self-signed SSL certificates. |
| CSRF Protection | CSRF tokens issued and validated for every POST request. |
| CORS Whitelisting | Only trusted origins are allowed access to the API. |
| Helmet Middleware | Provides protection against XSS, clickjacking, and MIME sniffing. |
| Rate Limiting | Prevents brute force attacks by limiting repeated requests per IP. |
| JWT Authentication | Secure sessions handled with JSON Web Tokens and HTTP-only cookies. |
| Database Security | SQLite prepared statements prevent SQL injection. |

---

## How to Run the Project Locally

### Prerequisites
- Node.js installed
- npm or yarn package manager

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

### Step 3: Run the Backend
```bash
cd SecurePaymentsAPI
npm install
npm run dev
```

Once started, the backend will be available at:
https://localhost:8443

### Step 4: Run the Frontend
Open a new terminal:
```bash
cd SecurePaymentsFrontend
npm install
npm run dev
```

Once started, the frontend will be available at:
https://localhost:5173

---

## DevSecOps Pipeline

This project includes a CI/CD pipeline that runs automatically on every push and pull request to ensure code quality and security.

### Pipeline Checks

The GitHub Actions workflow (`.github/workflows/ci.yml`) performs the following checks:

1. **Security Scanning**
   - Dependency vulnerability scanning using `npm audit`
   - Checks for high/critical vulnerabilities in both frontend and backend
   - Scans for hardcoded secrets in the codebase
   - Fails the build if security issues are detected

2. **Backend Validation**
   - Syntax validation of all JavaScript files
   - Verifies environment configuration files exist
   - Ensures `.env.example` contains required variables

3. **Frontend Validation**
   - Runs ESLint to check code quality
   - Builds the frontend application
   - Verifies build output is generated correctly

### Viewing Pipeline Results

Pipeline results are automatically available in the GitHub Actions tab:
- Go to your repository on GitHub
- Click on the "Actions" tab
- View the latest workflow runs and their status
- Click on any run to see detailed logs for each step

### Local Testing

To test the pipeline locally before pushing:
- Run `npm audit` in both frontend and backend directories
- Run `npm run lint` in the frontend directory
- Run `npm run build` in the frontend directory
- Verify all environment variables are documented in `.env.example`

---

## Sample Data for Testing

## Registration
Full Name: Emma Johnson
Email: emma.johnson@example.com
Password: Demo@123


## Payment 
Beneficiary Name: Olivia Smith
SWIFT: BARCGB22
IBAN: GB29NWBK60161331926819
Amount: 2750.00
Currency: GBP
Reference: Travel Reimbursement

---

[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/xgXPKfuw)
