import { useState, useEffect } from "react";
import "./App.css";

function App() {
    const [page, setPage] = useState("register"); // register | login | dashboard
    const [fullName, setFullName] = useState("");
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

    //Registration
    async function handleRegister(e) {
        e.preventDefault();
        setMessage("");
        try {
            const csrf = await getCsrf();
            const res = await fetch("https://localhost:8443/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "CSRF-Token": csrf,
                },
                credentials: "include",
                body: JSON.stringify({ fullName, email, password }),
            });

            if (res.status === 201) {
                setMessage("✅ Registration successful! You can now log in.");
                setFullName("");
                setEmail("");
                setPassword("");
                setTimeout(() => setPage("login"), 1500);
            } else if (res.status === 409) {
                setMessage("⚠️ Email already registered. Please log in instead.");
            } else {
                const err = await res.json();
                setMessage(`❌ ${err.error || "Registration failed"}`);
            }
        } catch (err) {
            setMessage(`❌ Network error: ${err.message}`);
        }
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
            <h1 className="portal-title">Secure International Payments Portal</h1>
            <p className="subtitle">
                Protecting your payments with SSL & Encryption.
            </p>

            {/* Toggle Buttons */}
            {page !== "dashboard" && (
                <div className="toggle-buttons">
                    <button
                        className={page === "register" ? "active-btn" : ""}
                        onClick={() => setPage("register")}
                    >
                        Register
                    </button>
                    <button
                        className={page === "login" ? "active-btn" : ""}
                        onClick={() => setPage("login")}
                    >
                        Login
                    </button>
                </div>
            )}

            {/* REGISTER */}
            {page === "register" && (
                <>
                    <h2>Create Your Account</h2>
                    <form onSubmit={handleRegister}>
                        <input
                            type="text"
                            placeholder="Full Name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                        />
                        <input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button type="submit">Register</button>
                    </form>
                    {message && <p className="message">{message}</p>}
                </>
            )}

            {/* LOGIN */}
            {page === "login" && (
                <>
                    <h2>Welcome Back</h2>
                    <form onSubmit={handleLogin}>
                        <input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button type="submit">Login</button>
                    </form>
                    {message && <p className="message">{message}</p>}
                </>
            )}

            {/* DASHBOARD */}
            {page === "dashboard" && (
                <>
                    <h2>Welcome, {user?.fullName || "User"} 👋</h2>
                    <p className="subtitle">You’re securely logged in under SSL.</p>

                    <button onClick={handleLogout}>Logout</button>

                    <div className="payments-section">
                        <h3 style={{ marginTop: "2rem" }}>Make a New Payment</h3>
                        <form onSubmit={handlePayment}>
                            <input
                                type="text"
                                placeholder="Beneficiary Name"
                                value={form.beneficiaryName}
                                onChange={(e) => setForm({ ...form, beneficiaryName: e.target.value })}
                                required
                            />
                            <input
                                type="text"
                                placeholder="SWIFT Code"
                                value={form.swift}
                                onChange={(e) => setForm({ ...form, swift: e.target.value })}
                                required
                            />
                            <input
                                type="text"
                                placeholder="IBAN"
                                value={form.iban}
                                onChange={(e) => setForm({ ...form, iban: e.target.value })}
                                required
                            />
                            <input
                                type="number"
                                placeholder="Amount"
                                value={form.amount}
                                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                required
                            />
                            <input
                                type="text"
                                placeholder="Currency (e.g. USD)"
                                value={form.currency}
                                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                                required
                            />
                            <input
                                type="text"
                                placeholder="Payment Reference"
                                value={form.reference}
                                onChange={(e) => setForm({ ...form, reference: e.target.value })}
                            />
                            <button type="submit">Submit Payment</button>
                        </form>

                        {message && <p className="message">{message}</p>}

                        <h3 style={{ marginTop: "2rem" }}>Your Payments</h3>
                        {payments.length === 0 ? (
                            <p>No payments found yet.</p>
                        ) : (
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
                                            <td>{p.beneficiaryName}</td>
                                            <td>{p.iban}</td>
                                            <td>{p.amount}</td>
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
                                            <td>{new Date(p.created_at).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
