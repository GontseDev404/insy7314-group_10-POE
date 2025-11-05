import { useState, useEffect } from "react";
import "./App.css";

function App() {
    const [page, setPage] = useState("login"); // login | dashboard
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [user, setUser] = useState(null);
    const [payments, setPayments] = useState([]);
    const [form, setForm] = useState({
        beneficiaryName: "",
        swift: "",
        iban: "",
        amount: "",
        currency: "",
        reference: "",
    });

    //CSRF helper
    async function getCsrf() {
        const res = await fetch("https://localhost:8443/api/csrf", {
            credentials: "include",
        });
        const data = await res.json();
        return data.csrf;
    }

    //Login
    async function handleLogin(e) {
        e.preventDefault();
        setMessage("");
        try {
            const csrf = await getCsrf();
            const res = await fetch("https://localhost:8443/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "CSRF-Token": csrf,
                },
                credentials: "include",
                body: JSON.stringify({ email, password }),
            });

            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
                setMessage("✅ Login successful!");
                setTimeout(() => setPage("dashboard"), 1000);
            } else {
                setMessage("❌ Invalid credentials. Try again.");
            }
        } catch (err) {
            setMessage(`❌ Network error: ${err.message}`);
        }
    }

    //Logout
    async function handleLogout() {
        await fetch("https://localhost:8443/api/logout", {
            method: "POST",
            credentials: "include",
        });
        setUser(null);
        setPayments([]);
        setPage("login");
    }

    //Payments
    async function fetchPayments() {
        const res = await fetch("https://localhost:8443/api/payments", {
            credentials: "include",
        });
        const data = await res.json();
        setPayments(data.items || []);
    }

    async function handlePayment(e) {
        e.preventDefault();
        setMessage("");
        try {
            const csrf = await getCsrf();
            const res = await fetch("https://localhost:8443/api/payments", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "CSRF-Token": csrf,
                },
                credentials: "include",
                body: JSON.stringify(form),
            });
            if (res.ok) {
                setMessage("✅ Payment queued successfully!");
                setForm({
                    beneficiaryName: "",
                    swift: "",
                    iban: "",
                    amount: "",
                    currency: "",
                    reference: "",
                });
                fetchPayments();
            } else {
                const err = await res.json();
                setMessage(`❌ ${err.error || "Payment failed"}`);
            }
        } catch (err) {
            setMessage(`❌ Network error: ${err.message}`);
        }
    }

    useEffect(() => {
        if (page === "dashboard") fetchPayments();
    }, [page]);

    return (
        <div className="container">
            <h1 className="portal-title">Secure Employee International Payments Portal</h1>
            <p className="subtitle">
                Protecting your payments with SSL & Encryption.
            </p>

            {/* LOGIN */}
            {page === "login" && (
                <>
                    <h2>Employee Login</h2>
                    <form onSubmit={handleLogin}>
                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                placeholder="your.email@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Password</label>
                            <input
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit">Sign In</button>
                    </form>
                    {message && (
                        <p className={`message ${message.includes("✅") ? "success" : "error"}`}>
                            {message}
                        </p>
                    )}
                </>
            )}

            {/* DASHBOARD */}
            {page === "dashboard" && (
                <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                        <div>
                            <h2 style={{ margin: 0, textAlign: "left" }}>Welcome, {user?.fullName || "User"} 👋</h2>
                            <p className="subtitle" style={{ margin: "0.5rem 0 0 0", textAlign: "left" }}>You're securely logged in under SSL.</p>
                        </div>
                        <button className="logout" onClick={handleLogout}>Logout</button>
                    </div>

                    <div className="payments-section">
                        <h3>Make a New Payment</h3>
                        <div className="payment-form">
                            <form onSubmit={handlePayment}>
                                <div className="payment-form-grid">
                                    <div className="form-group">
                                        <label>Beneficiary Name</label>
                                        <input
                                            type="text"
                                            placeholder="Enter beneficiary name"
                                            value={form.beneficiaryName}
                                            onChange={(e) => setForm({ ...form, beneficiaryName: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>SWIFT Code</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. BARCGB22"
                                            value={form.swift}
                                            onChange={(e) => setForm({ ...form, swift: e.target.value.toUpperCase() })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>IBAN</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. GB29NWBK60161331926819"
                                            value={form.iban}
                                            onChange={(e) => setForm({ ...form, iban: e.target.value.toUpperCase() })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Amount</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={form.amount}
                                            onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Currency</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. USD, EUR, GBP"
                                            value={form.currency}
                                            onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })}
                                            maxLength={3}
                                            required
                                        />
                                    </div>
                                    <div className="form-group payment-form-grid full-width">
                                        <label>Payment Reference (Optional)</label>
                                        <input
                                            type="text"
                                            placeholder="Enter payment reference"
                                            value={form.reference}
                                            onChange={(e) => setForm({ ...form, reference: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <button type="submit">Submit Payment</button>
                            </form>
                        </div>

                        {message && (
                            <p className={`message ${message.includes("✅") ? "success" : message.includes("❌") ? "error" : "warning"}`}>
                                {message}
                            </p>
                        )}

                        <h3>Your Payments</h3>
                        {payments.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">📋</div>
                                <p>No payments found yet.</p>
                                <p style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>Create your first payment above.</p>
                            </div>
                        ) : (
                            <div style={{ overflowX: "auto" }}>
                                <table className="payments-table">
                                    <thead>
                                        <tr>
                                            <th>Beneficiary</th>
                                            <th>IBAN</th>
                                            <th>Amount</th>
                                            <th>Currency</th>
                                            <th>Status</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.map((p) => (
                                            <tr key={p.id}>
                                                <td style={{ fontWeight: "600" }}>{p.beneficiary_name || p.beneficiaryName}</td>
                                                <td style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>{p.iban}</td>
                                                <td style={{ fontWeight: "600" }}>{parseFloat(p.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                <td>{p.currency}</td>
                                                <td>
                                                    <span
                                                        className={`status-badge ${p.status === "QUEUED"
                                                                ? "queued"
                                                                : p.status === "SUCCESS"
                                                                    ? "success"
                                                                    : "failed"
                                                            }`}
                                                    >
                                                        {p.status}
                                                    </span>
                                                </td>
                                                <td style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                                                    {new Date(p.created_at).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}

            <footer className="footer">
                © 2025 | Secure Payments Portal 
            </footer>
        </div>
    );
}

export default App;
