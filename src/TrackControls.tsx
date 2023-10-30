import { useState, useEffect, useRef, useContext } from "react";
import * as Tone from "tone";
import { TrackType } from "./types";
import TracksContext from "./TracksContext";

type TrackControlsProps = {
  trackHeight: number;
};

const TrackControls = ({ trackHeight }: TrackControlsProps): JSX.Element => {
  const { tracks, setTracks } = useContext(TracksContext)!;
  const trackControls: JSX.Element[] = [];

  //   possibly put track id on actual tracks object instead and use that here and in Tracks component
  for (let i = 0; i < tracks.length; i++) {
    trackControls.push(<TrackControl key={i} track={tracks[i]} trackID={i} trackHeight={trackHeight} setTracks={setTracks} />);
  }

  return <div className="track-controls">{trackControls}</div>;
};

type TrackControlProps = {
  track: TrackType;
  trackID: number;
  trackHeight: number;
  setTracks: React.Dispatch<React.SetStateAction<TrackType[]>>;
};

const TrackControl = ({ track, trackID, trackHeight, setTracks }: TrackControlProps): JSX.Element => {
  const [isMuted, setIsMuted] = useState(false);
  const [isSolo, setIsSolo] = useState(false);
  const [volume, setVolume] = useState(track.instrument.volume.value);
  const [trackName, setTrackName] = useState(track.name || `Track ${trackID}`);
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

  useEffect(() => {
    // Maybe standardize the placeholder "Track #" name to always be the track's literal name instead of sometimes having the track's name be ""
    if (trackName !== (track.name || `Track ${trackID}`)) {
      setTracks((prevTracks) => {
        const newTrack: TrackType = { ...track, name: trackName };

        const newTracks: TrackType[] = prevTracks.map((tr, i) => {
          if (i === trackID) {
            return newTrack;
          }

          return tr;
        });

        return newTracks;
      });
    }
  }, [trackName]);

  return (
    <div className="track-control" style={{ height: trackHeight }}>
      <input
        className="track-name"
        type="text"
        maxLength={21}
        value={trackName}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTrackName(e.target.value)}
        onBlur={(e: React.FocusEvent<HTMLInputElement, Element>) => e.target.value.trim() === "" && setTrackName(`Track ${trackID}`)}
      />
      <input
        className="volume-fader"
        type="range"
        min="-40"
        max="8"
        value={volume}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVolume(Number(e.target.value))}
        onDoubleClick={() => setVolume(-16)}
      />
      <label>
        <input type="checkbox" className="mute-solo-chk" checked={isMuted} onChange={() => setIsMuted(!isMuted)} />{" "}
        <div className="mute-btn">
          <div className="mute-btn-text">M</div>
        </div>
      </label>
      <label>
        <input type="checkbox" className="mute-solo-chk" checked={isSolo} onChange={() => setIsSolo(!isSolo)} />{" "}
        <div className="solo-btn">
          <div className="solo-btn-text">S</div>
        </div>
      </label>

      {/* can you pass a name to the instrument? If not, make a property for it on the tracks object */}
      {/* <p>{tracks[i].instrument.name}</p>  */}
    </div>
  );
};

export default TrackControls;
