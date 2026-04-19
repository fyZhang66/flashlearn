import { UserProvider } from "./contexts/UserContext";
import { TabProvider } from "./contexts/TabContext";
import AppContent from "./components/AppContent";
import "./App.css";

function App() {
  return (
    <UserProvider>
      <TabProvider>
        <AppContent />
      </TabProvider>
    </UserProvider>
  );
}

export default App;
