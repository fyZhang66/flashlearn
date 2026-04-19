import { useStats } from "../contexts/StatsContext";
import { useUser } from "../contexts/UserContext";
import { useTab } from "../contexts/TabContext";
import learnLogo from "../assets/learn.svg";
import addLogo from "../assets/add.svg";
import logoutLogo from "../assets/logout.svg";
import manageLogo from "../assets/manage.svg";
import "./NavTabs.css";

function NavTabs() {
  const { stats } = useStats();
  const { username, handleLogout } = useUser();
  const { activeTab, setActiveTab } = useTab();

  return (
    <div className="user-controls">
      <nav className="app-nav">
        <button
          className={`nav-tab ${activeTab === "review" ? "active" : ""}`}
          onClick={() => setActiveTab("review")}
        >
          <div className="logo-icon">
            <img src={learnLogo} alt="learn" width="16" height="16" />
          </div>
          Review
          {stats.due > 0 && <span className="badge">{stats.due}</span>}
        </button>
        <button
          className={`nav-tab ${activeTab === "create" ? "active" : ""}`}
          onClick={() => setActiveTab("create")}
        >
          <div className="logo-icon">
            <img src={addLogo} alt="add" width="16" height="16" />
          </div>
          Create
        </button>
        <button
          className={`nav-tab ${activeTab === "manage" ? "active" : ""}`}
          onClick={() => setActiveTab("manage")}
        >
          <div className="logo-icon">
            <img src={manageLogo} alt="manage" width="16" height="16" />
          </div>
          Manage
        </button>
      </nav>
      <div className="welcome-message">
        Welcome, <span className="username">{username}</span>
      </div>
      <button className="logout-btn" onClick={handleLogout}>
        <div className="logo-icon">
          <img src={logoutLogo} alt="logout" width="16" height="16" />
        </div>
        Logout
      </button>
    </div>
  );
}

export default NavTabs;
