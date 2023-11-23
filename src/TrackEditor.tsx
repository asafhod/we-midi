import { TrackType } from "./types";
import Track from "./Track";

type TrackEditorProps = {
  tracks: TrackType[];
  trackHeight: number;
  totalWidth: number;
  widthFactor: number;
  setNextMidiEditorTrackID: React.Dispatch<React.SetStateAction<number>>;
};

const TrackEditor = ({ tracks, trackHeight, totalWidth, widthFactor, setNextMidiEditorTrackID }: TrackEditorProps): JSX.Element => {
  // Figure out exactly how to set up the Track components. Redux/ContextAPI may help clarify.
  //   How to prevent all tracks from re-rendering when a single track is edited (none are added/removed)

  const trackComponents: JSX.Element[] = [];

  for (const track of tracks) {
    trackComponents.push(
      <Track
        key={track.id}
        track={track}
        width={totalWidth}
        height={trackHeight}
        widthFactor={widthFactor}
        setNextMidiEditorTrackID={setNextMidiEditorTrackID}
      />
    );
  }

  return <div className="track-editor">{trackComponents}</div>;
};

export default TrackEditor;
