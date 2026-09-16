import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles.css";
import "./showcase.css";
import './education.css';
import './design-system.css';
import './course-explorer.css';
import './mentor-page.css';
import SurfaceMotion from './surface-motion';

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <SurfaceMotion />
    </BrowserRouter>
  </React.StrictMode>,
);
