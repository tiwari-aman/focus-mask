import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/content.css";
import "./styles/desktop.css";

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
