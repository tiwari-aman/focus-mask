import React from "react";

// Get the extension icon URL from assets
const iconUrl = chrome.runtime.getURL("assets/icon48.png");

function Header() {
  return (
    <div className="header">
      <img src={iconUrl} alt="Focus Mask Logo" className="logo-img" />
      <div className="title">Focus Mask</div>
      <div className="subtitle">Focus on what matters</div>
    </div>
  );
}

export default Header;
