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
  const {
    state,
    loading,
    siteRestricted,
    isFileWithoutAccess,
    currentTabId,
    updateState,
  } = useExtensionState();

  const { handleToggle, handleClearAreas } = useExtensionActions(
    currentTabId,
    updateState,
  );

  const handleOpenSettings = () => {
    if (chrome.tabs?.create) {
      chrome.tabs.create({
        url: `chrome://extensions/?id=${chrome.runtime.id}`,
      });
    }
  };

  if (loading) {
    return <div className="popup-loading">Loading...</div>;
  }

  // Show local file permissions prompt
  if (isFileWithoutAccess) {
    return (
      <div className="popup-container">
        <Header />
        <div className="restricted-message file-access-message">
          <div className="restricted-icon file-access-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </div>
          <div className="restricted-title">Local File Detected</div>
          <div className="restricted-text">
            To use Focus Mask on local HTML files, please enable <strong>"Allow access to file URLs"</strong> in your extension settings.
          </div>
          <button
            className="file-settings-btn"
            onClick={handleOpenSettings}
          >
            Open Extension Settings
          </button>
        </div>
      </div>
    );
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
