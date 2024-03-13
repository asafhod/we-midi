import { useContext } from "react";
import TracksContext from "./TracksContext";
import { TrackType, TrackControlType } from "./types";
import TrackControls from "./TrackControls";
import InstrumentControls from "./InstrumentControls";

// TODO: Can probably get rid of this component and put the functions directly in TrackControls again. Still persistent because of Workspace states.
type EditorControlsProps = {
  tracks: TrackType[];
  setTracks: React.Dispatch<React.SetStateAction<TrackType[]>>;
  midiEditorTrack: TrackType | null | undefined;
  trackControls: TrackControlType[];
  setTrackControls: React.Dispatch<React.SetStateAction<TrackControlType[]>>;
  trackHeight: number;
  isPlaying: boolean;
};

const EditorControls = ({
  tracks,
  setTracks,
  midiEditorTrack,
  trackControls,
  setTrackControls,
  trackHeight,
  isPlaying,
}: EditorControlsProps): JSX.Element => {
  const { ws } = useContext(TracksContext)!;
  //   useCallback?
  const deleteTrack = (trackID: number) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({ action: "deleteTrack", data: { trackID } }));
      } catch (error) {
        console.error(`Error deleting track: ${error}`);
      }
    }
  };

  //   TODO: Needed? ref needed? useCallback?
  const toggleTrackSolo = (trackID: number) => {
    setTrackControls((prevTrackControls) => {
      return prevTrackControls.map((trackControl) =>
        trackControl.id === trackID ? { ...trackControl, solo: !trackControl.solo } : trackControl
      );
    });
  };

  return (
    <>
      {midiEditorTrack ? (
        <InstrumentControls track={midiEditorTrack} />
      ) : (
        <TrackControls
          tracks={tracks}
          setTracks={setTracks}
          trackControls={trackControls}
          setTrackControls={setTrackControls}
          toggleTrackSolo={toggleTrackSolo}
          deleteTrack={deleteTrack}
          trackHeight={trackHeight}
          isPlaying={isPlaying}
        />
      )}
    </>
  );
};

export default EditorControls;
