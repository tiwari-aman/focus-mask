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
  const { state, loading, siteRestricted, currentTabId, updateState } =
    useExtensionState();

  const { handleToggle, handleClearAreas } = useExtensionActions(
    currentTabId,
    updateState,
  );

  if (loading) {
    return <div className="popup-loading">Loading...</div>;
  }

  // Show restricted site message
  if (siteRestricted) {
    return (
      <div className="popup-container">
        <Header />
        <div className="restricted-message">
          <div className="restricted-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          </div>
          <div className="restricted-title">Not Available</div>
          <div className="restricted-text">
            Focus Mask cannot run on this page. Browser system pages and
            extension stores are restricted.
          </div>
        </div>
      </div>
    );
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
        <div style={{ marginTop: "8px" }}>
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
