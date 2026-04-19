import { useUser } from "../contexts/UserContext";
import NavTabs from "./NavTabs";
import logoSvg from "../assets/logo.svg";
import errorLogo from "../assets/error.svg";

function Header() {
  const { isLogged, errorMessage } = useUser();
  
  return (
    <>
      <header className="app-header">
        <div className="logo-container">
          <div className="logo-icon">
            <img src={logoSvg} alt="FlashLearn Logo" width="32" height="32" />
          </div>
          <h1 className="app-title">FlashLearn</h1>
        </div>
        
        {isLogged && <NavTabs />}
      </header>

      {errorMessage && (
        <div className="error-container">
          <div className="logo-icon">
            <img src={errorLogo} alt="error" width="16" height="16" />
          </div>
          <p className="error-message">{errorMessage}</p>
        </div>
      )}
    </>
  );
}

export default Header;