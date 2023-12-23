import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

// Import Bootstrap
import "bootstrap/dist/css/bootstrap.min.css";

// import Amplify
import { Amplify } from "aws-amplify";
import config from "./aws-exports";

// configure Amplify
Amplify.configure(config);

// render application
const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
