import Track from "./Track";

type TracksProps = {
  numTracks: number;
  trackHeight: number;
  totalWidth: number;
  scaleWidth: number;
  setNextMidiEditorTrackID: React.Dispatch<React.SetStateAction<number>>;
};

const Tracks = ({ numTracks, trackHeight, totalWidth, scaleWidth, setNextMidiEditorTrackID }: TracksProps): JSX.Element => {
  // Figure out exactly how to set up the Track components. Redux/ContextAPI may help clarify.
  //   How to prevent all tracks from re-rendering when a single track is edited (none are added/removed)

  let trackComponents: JSX.Element[] = [];

  for (let i = 0; i < numTracks; i++) {
    trackComponents[i] = (
      <Track
        key={i}
        trackID={i}
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
