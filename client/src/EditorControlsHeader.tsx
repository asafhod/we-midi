import { useContext } from "react";
import { TrackType } from "./types";
import TracksContext from "./TracksContext";

type EditorControlsHeaderProps = {
  tracks: TrackType[];
  midiEditorTrack: TrackType | null | undefined;
};

const EditorControlsHeader = ({ tracks, midiEditorTrack }: EditorControlsHeaderProps): JSX.Element => {
  // get WebSocket from context
  const { ws } = useContext(TracksContext)!;

  const maxTracks: number = 100;

  const addTrack = () => {
    if (tracks.length >= maxTracks) {
      alert(`The maximum amount of tracks is ${maxTracks}.`);
    } else if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({ action: "addTrack" }));
      } catch (error) {
        console.error(`Error adding track: ${error}`);
      }
    }
  };

  return (
    <div className="track-controls-header">
      {midiEditorTrack ? (
        <p className="track-controls-header-lbl">{midiEditorTrack.name}</p>
      ) : (
        <>
          <button type="button" className="add-track-btn" onClick={addTrack}>
            +
          </button>
          <p className="track-controls-header-lbl">{"Tracks"}</p>
        </>
      )}
    </div>
  );
};

export default EditorControlsHeader;
