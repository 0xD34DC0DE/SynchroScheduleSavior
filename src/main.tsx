import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import {CssBaseline} from "@mui/material";
import "./style.css"

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <CssBaseline/>
        <App/>
    </React.StrictMode>,
);
