import { TrackType } from "./types";
import Track from "./Track";

type TracksProps = {
  tracks: TrackType[];
  trackHeight: number;
  totalWidth: number;
  scaleWidth: number;
  setNextMidiEditorTrackID: React.Dispatch<React.SetStateAction<number>>;
};

const Tracks = ({ tracks, trackHeight, totalWidth, scaleWidth, setNextMidiEditorTrackID }: TracksProps): JSX.Element => {
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
        scaleWidth={scaleWidth}
        setNextMidiEditorTrackID={setNextMidiEditorTrackID}
      />
    );
  }

  return <div className="tracks">{trackComponents}</div>;
};

export default Tracks;
