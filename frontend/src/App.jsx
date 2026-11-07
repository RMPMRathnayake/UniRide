import { useState } from "react";

import Login from "./pages/Login";
import RoleSelection from "./pages/RoleSelection";
import StudentRegister from "./pages/StudentRegister";
import RiderRegister from "./pages/RiderRegister";
import ForgotPassword from "./pages/ForgotPassword";

import "./App.css";

function App() {
  const [page, setPage] = useState("login");

  const goTo = (nextPage) => {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderPage = () => {
    switch (page) {
      case "role":
        return <RoleSelection goTo={goTo} />;

      case "student":
        return <StudentRegister goTo={goTo} />;

      case "rider":
        return <RiderRegister goTo={goTo} />;

      case "forgot":
        return <ForgotPassword goTo={goTo} />;

      default:
        return <Login goTo={goTo} />;
    }
  };

  return (
    <main className="app-container">

      {/* DESKTOP BRAND PANEL */}
      <section className="brand-panel">

        <div className="brand-content">

          <img
            src="/logo.PNG"
            alt="UniRide Logo"
            className="brand-logo"
          />

          <h2>Move Smart. Live Easy.</h2>

          <p>
            Your campus journey starts here.
            Connect, travel and make every ride easier.
          </p>

          <span className="brand-footer">
            UniRide Campus Transportation
          </span>

        </div>

      </section>

      {/* AUTH PANEL */}
      <section className="auth-panel">

        {/* MOBILE LOGO */}
        <div className="mobile-brand">

          <img
            src="/logo.PNG"
            alt="UniRide Logo"
          />

        </div>

        {/* AUTH CONTENT */}
        <div className="auth-content">
          {renderPage()}
        </div>

        <footer className="mobile-footer">
          © 2026 UniRide. All rights reserved.
        </footer>

      </section>

    </main>
  );
}

export default App;