function RoleSelection({ goTo }) {
  return (
    <div className="auth-form">

      <div className="form-heading">

        <span className="eyebrow">CREATE ACCOUNT</span>

        <h2>Join UniRide</h2>

        <p>
          Choose your account type to get started.
        </p>

      </div>

      <div className="role-list">

        <button
          className="role-option"
          onClick={() => goTo("student")}
        >

          <span className="role-icon">🎓</span>

          <span className="role-text">
            <strong>Student</strong>
            <small>Register as a university student</small>
          </span>

          <span className="role-arrow">›</span>

        </button>

        <button
          className="role-option"
          onClick={() => goTo("driver")}
        >

          <span className="role-icon">🏍️</span>

          <span className="role-text">
            <strong>Driver</strong>
            <small>Register as a UniRide driver</small>
          </span>

          <span className="role-arrow">›</span>

        </button>

      </div>

      <div className="form-bottom">

        Already have an account?

        <button
          className="text-button signup-link"
          onClick={() => goTo("login")}
        >
          Login
        </button>

      </div>

    </div>
  );
}

export default RoleSelection;