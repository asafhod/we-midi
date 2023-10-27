import { useState, useEffect, useRef, useContext } from "react";
import * as Tone from "tone";
import { TrackType } from "./types";
import TracksContext from "./TracksContext";

type TrackControlsProps = {
  trackHeight: number;
};

const TrackControls = ({ trackHeight }: TrackControlsProps): JSX.Element => {
  const { tracks } = useContext(TracksContext)!;
  const trackControls: JSX.Element[] = [];

  //   possibly put track id on actual tracks object instead and use that here and in Tracks component
  for (let i = 0; i < tracks.length; i++) {
    trackControls.push(<TrackControl key={i} track={tracks[i]} trackNum={i} trackHeight={trackHeight} />);
  }

  return <div className="track-controls">{trackControls}</div>;
};

type TrackControlProps = {
  track: TrackType;
  trackNum: number;
  trackHeight: number;
};

const TrackControl = ({ track, trackNum, trackHeight }: TrackControlProps): JSX.Element => {
  const [isMuted, setIsMuted] = useState(false);
  const [isSolo, setIsSolo] = useState(false);
  const [volume, setVolume] = useState(track.instrument.volume.value);
  const volumeRef = useRef(new Tone.Volume(volume));

  useEffect(() => {
    track.instrument.chain(volumeRef.current, Tone.Destination);

    return () => {
      volumeRef.current.dispose();
    };
    // TODO: Address warnings
    // Additional dispose logic? What about when instrument changes?
  }, []);

  useEffect(() => {
    if (isMuted) {
      volumeRef.current.mute = true;
    } else {
      volumeRef.current.mute = false;
    }
  }, [isMuted]);

  // TODO: Implement
  useEffect(() => {
    if (isSolo) {
    } else {
    }
  }, [isSolo]);

  useEffect(() => {
    volumeRef.current.volume.value = volume;
  }, [volume]);

  return (
    <div className="track-control" style={{ height: trackHeight }}>
      <p>{track.name || `Track ${trackNum}`}</p>
      <input
        type="range"
        min="-20"
        max="20"
        value={volume}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVolume(Number(e.target.value))}
      />
      <label>
        <input type="checkbox" checked={isMuted} onChange={() => setIsMuted(!isMuted)} /> Mute
      </label>
      <label>
        <input type="checkbox" checked={isSolo} onChange={() => setIsSolo(!isSolo)} /> Solo
      </label>

      {/* can you pass a name to the instrument? If not, make a property for it on the tracks object */}
      {/* <p>{tracks[i].instrument.name}</p>  */}
    </div>
  );
};

export default TrackControls;
