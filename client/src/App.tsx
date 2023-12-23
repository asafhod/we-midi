import "./App.css";
import "@aws-amplify/ui-react/styles.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Home";
import ProtectedApp from "./ProtectedApp";

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route index element={<Home />} />
          <Route path="/*" element={<ProtectedApp />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
