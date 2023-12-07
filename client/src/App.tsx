import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProjectsList from "./ProjectsList";
import Workspace from "./Workspace";

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route index element={<ProjectsList />} />
          <Route path="/project" element={<Workspace />} />
          <Route path="/project/:id" element={<Workspace />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
