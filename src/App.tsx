import "./App.css";
import { useState } from "react";
import Workspace from "./Workspace";
import midiURL from "./assets/MIDI_sample.mid"; // Get rid of this later

function App() {
  const [showWorkspace, setShowWorkspace] = useState(false);

  return (
    <div className="App">
      {showWorkspace ? (
        <Workspace midiURL={midiURL} />
      ) : (
        <button type="button" onClick={() => setShowWorkspace(true)}>
          Open Workspace
        </button>
      )}
    </div>
  );
}

export default App;
