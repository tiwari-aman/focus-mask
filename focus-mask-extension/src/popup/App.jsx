import React from "react";
import Header from "./components/Header";
import PrimaryControl from "./components/PrimaryControl";
import AreaManagement from "./components/AreaManagement";
import ToggleRow from "./components/ToggleRow";
import useExtensionState from "./hooks/useExtensionState";
import useExtensionActions from "./hooks/useExtensionActions";

/**
 * Main popup component for Focus Mask extension
 */
function App() {
  const { state, loading, currentTabId, updateState } = useExtensionState();
  
  const { handleToggle, handleClearAreas } = useExtensionActions(
    currentTabId,
    updateState
  );

  if (loading) {
    return <div className="popup-loading">Loading...</div>;
  }

  return (
    <div className="popup-container">
      {/* 1. Header - Branding */}
      <Header />

      {/* 2. Controls Section */}
      <div className="section">
        <div className="section-title">Controls</div>
        
        {/* Enable Extension Toggle */}
        <PrimaryControl enabled={state.enabled} onToggle={handleToggle} />
        
        {/* Enable Floating Toolbar Toggle */}
        <div style={{ marginTop: '8px' }}>
          <ToggleRow 
            label="Floating Toolbar" 
            description="Show on-page control bar"
            checked={state.toolbarEnabled}
            onChange={(value) => updateState("toolbarEnabled", value)}
          />
        </div>
      </div>
      
      {/* 3. Actions Section */}
      <AreaManagement 
        areasCount={state.areas.length} 
        onClear={handleClearAreas} 
      />
    </div>
  );
}

export default App;
