import { NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import "./Navbar.css";

const Navbar = () => {
  const { authState, logout } = useAuth();

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out?")) {
      await logout();
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1>Yoto Playlist Creator</h1>
      </div>
      <div className="navbar-links">
        {authState.isAuthenticated ? (
          <>
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <span className="nav-icon">🎵</span>
              Playlists
            </NavLink>
            <NavLink
              to="/playlist/create"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <span className="nav-icon">➕</span>
              Create New
            </NavLink>
            <NavLink
              to="/job-queue"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <span className="nav-icon">📋</span>
              Job Queue
            </NavLink>
            <NavLink
              to="/custom-icons"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <span className="nav-icon">🎨</span>
              Custom Icons
            </NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <span className="nav-icon">⚙️</span>
              Settings
            </NavLink>
            <NavLink
              to="/help"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <span className="nav-icon">❓</span>
              Help
            </NavLink>
            <button
              type="button"
              onClick={handleLogout}
              className="nav-link logout-btn"
              title="Logout"
            >
              <span className="nav-icon">🚪</span>
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink
              to="/help"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <span className="nav-icon">❓</span>
              Help
            </NavLink>
            <NavLink
              to="/login"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <span className="nav-icon">🔑</span>
              Login
            </NavLink>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
