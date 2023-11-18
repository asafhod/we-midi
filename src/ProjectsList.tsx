import { useState } from "react";
import midiURL from "./assets/MIDI_sample.mid"; // Get rid of this later
import Workspace from "./Workspace";

const ProjectsList = (): JSX.Element => {
  const [showWorkspace, setShowWorkspace] = useState(false);

  return (
    <div className="projects-list">
      {showWorkspace ? (
        <Workspace midiURL={midiURL} />
      ) : (
        <button type="button" onClick={() => setShowWorkspace(true)}>
          Open Workspace
        </button>
      )}
    </div>
  );
};

export default ProjectsList;
