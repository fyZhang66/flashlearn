import { useUser } from "../contexts/UserContext";
import { useTab } from "../contexts/TabContext";
import { StatsProvider } from "../contexts/StatsContext";
import Login from "./Login";
import Review from "./Review";
import CreateCard from "./CreateCard";
import CardManage from "./CardManage";
import Header from "./Header";
import "../App.css";

function AppContent() {
  const { isLogged, isLoading } = useUser();
  const { activeTab } = useTab();

  if (isLoading) {
    return (
      <div className="App">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your learning journey...</p>
        </div>
      </div>
    );
  }

  return (
    <StatsProvider>
      <div className="App">
        <div className="app-background"></div>
        
        <Header />
        
        <main className="app-content">
          {isLogged ? (
            <>
              {activeTab === 'review' && <Review />}
              {activeTab === 'create' && <CreateCard />}
              {activeTab === 'manage' && <CardManage />}
            </>
          ) : (
            <div className="login-wrapper">
              <div className="login-hero">
                <h2>Enhance your memory with spaced repetition</h2>
                <p>FlashLearn helps you remember what you learn by showing you information at strategic intervals.</p>
              </div>
              <Login />
            </div>
          )}
        </main>
        
        <footer className="app-footer">
          <p>© {new Date().getFullYear()} FlashLearn. Made with ♥ for learning.</p>
        </footer>
      </div>
    </StatsProvider>
  );
}

export default AppContent;