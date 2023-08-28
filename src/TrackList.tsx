import Track from "./Track";

type TrackListProps = {
  numTracks: number;
};

const TrackList = ({ numTracks }: TrackListProps) => {
  // Figure out exactly how to set up the Track components. Redux/ContextAPI may help clarify.
  //   How to prevent list from re-rendering when a single track is edited (none are added/removed)
  let trackComponents: JSX.Element[] = [];

  for (let i = 0; i < numTracks; i++) {
    trackComponents[i] = <Track key={i} trackID={i} />;
  }

  return <>{trackComponents}</>;
};

export default TrackList;
