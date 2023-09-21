import { useContext } from "react";
import TracksContext from "./TracksContext";

type TrackControlsProps = {
  trackHeight: number;
};

const TrackControls = ({ trackHeight }: TrackControlsProps): JSX.Element => {
  const { tracks } = useContext(TracksContext)!;
  const trackControls: JSX.Element[] = [];

  //   possibly put track id on actual tracks object instead and use that here and in Tracks component
  for (let i = 0; i < tracks.length; i++) {
    trackControls.push(
      <div className="track-control" key={i} style={{ height: trackHeight }}>
        <p>{tracks[i].name || `Track ${i}`}</p>
        {/* can you pass a name to the instrument? If not, make a property for it on the tracks object */}
        {/* <p>{tracks[i].instrument.name}</p>  */}
      </div>
    );
  }

  return <div className="track-controls">{trackControls}</div>;
};

export default TrackControls;
