import React, { useState } from "react";

/**
 * TabContainer - Lightweight tab switcher for toolbar content
 * 
 * UX Purpose: Separates primary actions (Focus) from secondary configuration (Settings)
 * This reduces visual clutter and groups related controls logically
 * 
 * Design: Uses existing toolbar styles, minimal overhead
 */
function TabContainer({ tabs }) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <>
      {/* Tab navigation */}
      <div className="focusmask-tabs">
        {tabs.map((tab, index) => (
          <button
            key={index}
            className={`focusmask-tab ${activeTab === index ? "active" : ""}`}
            onClick={() => setActiveTab(index)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active tab content */}
      <div className="focusmask-tab-content">
        {tabs[activeTab].content}
      </div>
    </>
  );
}

export default TabContainer;
