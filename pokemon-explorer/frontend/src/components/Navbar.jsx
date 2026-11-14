
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";

function Navbar() {
  const navigate = useNavigate();

  const [isLoggedIn, setIsLoggedIn] = useState(
    () => Boolean(localStorage.getItem("token"))
  );

  const [member] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("member")) || null;
    } catch {
      return null;
    }
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("member");

    setIsLoggedIn(false);

    navigate("/login");
  };

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        <span className="brand-icon">◉</span>
        <span>
          POKÉ<span className="brand-highlight">DEX</span>
        </span>
      </Link>

      <nav className="nav-links">
  <Link to="/" className="active">Home</Link>
  <a href="/#pokemon">Pokémon</a>
  <Link to="/favorites">Favorites</Link>

  {isLoggedIn && (
    <Link to="/profile">My Profile</Link>
  )}

  {isLoggedIn && member?.role === "admin" && (
    <Link to="/admin">Admin</Link>
  )}
</nav>
      <div className="nav-actions">
        {isLoggedIn ? (
          <>
            <span className="member-name">
              {member?.display_name || "สมาชิก"}
            </span>

            <button
              className="login-button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="login-button">
              Login
            </Link>

            <Link to="/register" className="register-button">
              Sign Up
            </Link>
          </>
        )}

        <button className="mobile-menu" aria-label="Open menu">
          <Menu size={23} />
        </button>
      </div>
    </header>
  );
}

export default Navbar;
