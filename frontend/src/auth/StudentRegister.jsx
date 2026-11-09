import { useState } from "react";

const securityQuestions = [
  "What is your favourite food?",
  "What is your favourite colour?",
  "What is your childhood nickname?",
  "What is your favourite animal?"
];

function StudentRegister({ goTo }) {
  const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth`;
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    studentRegistrationNumber: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    securityQuestion: "",
    securityAnswer: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const normalizedPhone = formData.phoneNumber.replace(/[\s()-]/g, "");

    if (!/^\+?[0-9]{7,15}$/.test(normalizedPhone)) {
      setError("Please enter a valid phone number");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must contain at least 6 characters");
      return;
    }

    if (!formData.securityAnswer.trim()) {
      setError("Please enter your security answer");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API}/register/student`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            ...formData,
            phoneNumber: normalizedPhone
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      alert("Student account created successfully!");
      goTo("login");

    } catch (error) {
      setError(
        error.message === "Failed to fetch"
          ? "Cannot connect to server. Please try again."
          : error.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form">

      <div className="form-heading">
        <span className="eyebrow">STUDENT ACCOUNT</span>
        <h2>Student Registration</h2>
        <p>Create your UniRide student account.</p>
      </div>

      <form onSubmit={handleSubmit}>

        <div className="input-group">
          <label>Full Name</label>
          <input
            type="text"
            name="fullName"
            placeholder="Enter your full name"
            value={formData.fullName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="input-group">
          <label>Email Address</label>
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="input-group">
          <label>Student Registration Number</label>
          <input
            type="text"
            name="studentRegistrationNumber"
            placeholder="Enter your student ID"
            value={formData.studentRegistrationNumber}
            onChange={handleChange}
            required
          />
        </div>

        <div className="input-group">
          <label>Phone Number</label>
          <input
            type="tel"
            name="phoneNumber"
            placeholder="Enter your phone number"
            value={formData.phoneNumber}
            onChange={handleChange}
            autoComplete="tel"
            required
          />
        </div>

        <div className="input-group">
          <label>Password</label>
          <input
            type="password"
            name="password"
            placeholder="Create a password"
            value={formData.password}
            onChange={handleChange}
            minLength="6"
            required
          />
        </div>

        <div className="input-group">
          <label>Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={handleChange}
            minLength="6"
            required
          />
        </div>

        <div className="input-group">
          <label>Security Question</label>
          <select
            name="securityQuestion"
            value={formData.securityQuestion}
            onChange={handleChange}
            required
          >
            <option value="">Select a security question</option>

            {securityQuestions.map((question) => (
              <option key={question} value={question}>
                {question}
              </option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label>Security Answer</label>
          <input
            type="text"
            name="securityAnswer"
            placeholder="Enter your secret answer"
            value={formData.securityAnswer}
            onChange={handleChange}
            autoComplete="off"
            required
          />
        </div>

        <p style={{ fontSize: "12px", color: "#777" }}>
          Remember your answer. You will need it to reset your password.
        </p>

        {error && (
          <p style={{ color: "#dc2626", fontSize: "14px" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          className="primary-button"
          disabled={loading}
        >
          {loading ? "Creating Account..." : "Create Student Account"}
        </button>

      </form>

      <div className="form-bottom">
        <button
          type="button"
          className="text-button"
          onClick={() => goTo("role")}
        >
          ← Back to account types
        </button>
      </div>

    </div>
  );
}

export default StudentRegister;