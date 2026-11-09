
import { useState } from "react";

function ForgotPassword({ goTo }) {
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth`;

  // STEP 1 - REQUEST VERIFICATION CODE
  const handleSendCode = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API}/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to start verification"
        );
      }

      setSuccess("Verification code is ready.");
      setStep(2);

    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to server."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  // STEP 2 - VERIFY OTP
  const handleVerifyCode = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API}/verify-reset-code`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: email.trim(),
            code: otp
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Verification failed"
        );
      }

      setResetToken(data.resetToken);
      setSuccess("Verification successful!");
      setStep(3);

    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to server."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  // STEP 3 - RESET PASSWORD
  const handleResetPassword = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (newPassword.length < 6) {
      setError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API}/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            resetToken,
            newPassword,
            confirmPassword
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Password reset failed"
        );
      }

      alert(
        "Password reset successful! Please login."
      );

      goTo("login");

    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to server."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form">

      {/* FORM HEADING */}

      <div className="form-heading">

        <span className="eyebrow">
          ACCOUNT RECOVERY
        </span>

        <h2>Forgot Password?</h2>

        <p>
          {step === 1 &&
            "Enter your registered email address."}

          {step === 2 &&
            "Enter the 6-digit verification code."}

          {step === 3 &&
            "Create a new password for your account."}
        </p>

      </div>

      {/* STEP 1 - EMAIL */}

      {step === 1 && (
        <form onSubmit={handleSendCode}>

          <div className="input-group">

            <label>Email Address</label>

            <input
              type="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
            />

          </div>

          <p style={{
            fontSize: "12px",
            color: "#888",
            margin: "8px 0",
            textAlign: "center"
          }}>
            Demo Verification
          </p>

          <button
            type="submit"
            className="primary-button"
            disabled={loading}
          >
            {loading ? "Checking..." : "Continue"}
          </button>

        </form>
      )}

      {/* STEP 2 - OTP VERIFICATION */}

      {step === 2 && (
        <form onSubmit={handleVerifyCode}>

          <div className="input-group">

            <label>Registered Email</label>

            <input
              type="email"
              value={email}
              readOnly
            />

          </div>

          <div style={{
            textAlign: "center",
            margin: "15px 0"
          }}>

            <div style={{
              fontSize: "13px",
              color: "#777",
              marginBottom: "8px"
            }}>
              Demo verification code: 123456. No email is sent. Code requested for
            </div>

            <strong style={{
              fontSize: "14px",
              color: "#222"
            }}>
              {email}
            </strong>

          </div>

          <div className="input-group">

            <label>6-Digit Verification Code</label>

            <input
              type="text"
              placeholder="Enter verification code"
              value={otp}
              onChange={(e) =>
                setOtp(
                  e.target.value
                    .replace(/\D/g, "")
                    .slice(0, 6)
                )
              }
              inputMode="numeric"
              maxLength="6"
              autoComplete="one-time-code"
              required
            />

          </div>

          <p style={{
            fontSize: "12px",
            color: "#888",
            textAlign: "center",
            margin: "8px 0"
          }}>
            Demo OTP: 123456
          </p>

          <button
            type="submit"
            className="primary-button"
            disabled={loading || otp.length !== 6}
          >
            {loading ? "Verifying..." : "Verify Code"}
          </button>

          <button
            type="button"
            className="text-button"
            onClick={() => {
              setStep(1);
              setOtp("");
              setError("");
              setSuccess("");
            }}
          >
            Change Email Address
          </button>

        </form>
      )}

      {/* STEP 3 - NEW PASSWORD */}

      {step === 3 && (
        <form onSubmit={handleResetPassword}>

          <div className="input-group">

            <label>New Password</label>

            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) =>
                setNewPassword(e.target.value)
              }
              minLength="6"
              required
            />

          </div>

          <div className="input-group">

            <label>Confirm New Password</label>

            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
              minLength="6"
              required
            />

          </div>

          <button
            type="submit"
            className="primary-button"
            disabled={loading}
          >
            {loading ? "Updating..." : "Reset Password"}
          </button>

        </form>
      )}

      {/* ERROR MESSAGE */}

      {error && (
        <p style={{
          color: "#dc2626",
          fontSize: "14px",
          marginTop: "12px"
        }}>
          {error}
        </p>
      )}

      {/* SUCCESS MESSAGE */}

      {success && (
        <p style={{
          color: "#16a34a",
          fontSize: "14px",
          marginTop: "12px"
        }}>
          {success}
        </p>
      )}

      {/* BACK TO LOGIN */}

      <div className="form-bottom">

        <button
          type="button"
          className="text-button"
          onClick={() => goTo("login")}
        >
          ← Back to Login
        </button>

      </div>

    </div>
  );
}

export default ForgotPassword;
