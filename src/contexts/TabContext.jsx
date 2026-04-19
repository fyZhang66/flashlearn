import React, { createContext, useState, useContext } from 'react';


const TabContext = createContext();


export const useTab = () => {
  const context = useContext(TabContext);
  if (!context) {
    throw new Error('useTab must be used within a TabProvider');
  }
  return context;
};

export function TabProvider({ children }) {
  const [activeTab, setActiveTab] = useState("review");

  const value = {
    activeTab,
    setActiveTab
  };

  return (
    <TabContext.Provider value={value}>
      {children}
    </TabContext.Provider>
  );
}

export default TabContext;