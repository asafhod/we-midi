import { useState, useEffect, useRef, useContext } from "react";
import * as Tone from "tone";
import { TrackType, NoteType } from "./types";
import TracksContext from "./TracksContext";
import createInstrument from "./instruments/createInstrument";
import instrumentIcons from "./instruments/instrumentIcons";

type TrackControlsProps = {
  trackHeight: number;
  isPlaying: boolean;
};

const TrackControls = ({ trackHeight, isPlaying }: TrackControlsProps): JSX.Element => {
  const { tracks, setTracks } = useContext(TracksContext)!;
  const trackControls: JSX.Element[] = [];

  //   possibly put track id on actual tracks object instead and use that here and in Tracks component
  for (let i = 0; i < tracks.length; i++) {
    trackControls.push(
      <TrackControl key={i} track={tracks[i]} trackID={i} trackHeight={trackHeight} setTracks={setTracks} isPlaying={isPlaying} />
    );
  }

  return <div className="track-controls">{trackControls}</div>;
};

type TrackControlProps = {
  track: TrackType;
  trackID: number;
  trackHeight: number;
  setTracks: React.Dispatch<React.SetStateAction<TrackType[]>>;
  isPlaying: boolean;
};

const TrackControl = ({ track, trackID, trackHeight, setTracks, isPlaying }: TrackControlProps): JSX.Element => {
  const [isMuted, setIsMuted] = useState(false);
  const [isSolo, setIsSolo] = useState(false);
  const [volume, setVolume] = useState(track.instrument.volume.value);
  const [trackName, setTrackName] = useState(track.name || `Track ${trackID}`);
  const [instrument, setInstrument] = useState(track.instrumentName);
  const volumeRef = useRef(new Tone.Volume(volume));

  useEffect(() => {
    track.instrument.chain(volumeRef.current, Tone.Destination);

    // TODO: Address warnings
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
    if (track.instrumentName !== instrument) {
      track.instrument.dispose();

      const { instrument: newInstrument } = createInstrument(instrument);
      newInstrument.chain(volumeRef.current, Tone.Destination);

      const newNotes: NoteType[] = [];

      for (const note of track.notes) {
        const { noteID, name, midiNum, duration, noteTime, velocity } = note;
        Tone.Transport.clear(noteID);

        const newNoteID: number = Tone.Transport.schedule((time) => {
          newInstrument.triggerAttackRelease(name, duration, time, velocity);
        }, noteTime);

        const newNote: NoteType = { noteID: newNoteID, name, midiNum, duration, noteTime, velocity };
        newNotes.push(newNote);
      }

      const newTrack: TrackType = {
        name: track.name,
        instrumentName: instrument,
        instrument: newInstrument,
        notes: newNotes,
        minNote: track.minNote,
        maxNote: track.maxNote,
      };

      // TODO: avoid repeating this. function?
      setTracks((prevTracks) => {
        const newTracks: TrackType[] = prevTracks.map((tr, i) => {
          if (i === trackID) {
            return newTrack;
          }

          return tr;
        });

        return newTracks;
      });
    }
  }, [instrument]);

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
        maxLength={15}
        value={trackName}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTrackName(e.target.value)}
        onBlur={(e: React.FocusEvent<HTMLInputElement, Element>) => e.target.value.trim() === "" && setTrackName(`Track ${trackID}`)}
      />
      <InstrumentSelect instrument={instrument} setInstrument={setInstrument} isPlaying={isPlaying} />
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
          <div className="mute-btn-text">Mute</div>
        </div>
      </label>
      <label>
        <input type="checkbox" className="mute-solo-chk" checked={isSolo} onChange={() => setIsSolo(!isSolo)} />{" "}
        <div className="solo-btn">
          <div className="solo-btn-text">Solo</div>
        </div>
      </label>

      {/* can you pass a name to the instrument? If not, make a property for it on the tracks object */}
      {/* <p>{tracks[i].instrument.name}</p>  */}
    </div>
  );
};

type InstrumentSelectProps = {
  instrument: string;
  setInstrument: React.Dispatch<React.SetStateAction<string>>;
  isPlaying: boolean; // Less prop drilling? Context?
};

const InstrumentSelect = ({ instrument, setInstrument, isPlaying }: InstrumentSelectProps): JSX.Element => {
  const [isSelecting, setIsSelecting] = useState(false);

  const selectInstrument = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const selectedElement = e.target as HTMLDivElement;
    const instrumentName: string | undefined = selectedElement.dataset.instrument;

    if (instrumentName) {
      setInstrument(instrumentName);
      setIsSelecting(false);
    }
  };

  return isSelecting ? (
    <div className="instrument-select" onClick={(e) => selectInstrument(e)}>
      <img
        className="instrument-option"
        data-instrument="guitar"
        src={instrumentIcons["guitar"]}
        alt={"Clean Guitar"}
        height="20px"
        width="20px"
      />
      <img
        className="instrument-option"
        data-instrument="guitarDist"
        src={instrumentIcons["guitarDist"]}
        alt={"Distorted Guitar"}
        height="20px"
        width="20px"
      />
      <img
        className="instrument-option"
        data-instrument="bass"
        src={instrumentIcons["bass"]}
        alt={"Bass"}
        height="20px"
        width="20px"
      />
      <img
        className="instrument-option"
        data-instrument="piano"
        src={instrumentIcons["piano"]}
        alt={"Piano"}
        height="20px"
        width="20px"
      />
      <img
        className="instrument-option"
        data-instrument="drums"
        src={instrumentIcons["drums"]}
        alt={"Drums"}
        height="20px"
        width="20px"
      />
      <img
        className="instrument-option"
        data-instrument="8-bit"
        src={instrumentIcons["8-bit"]}
        alt={"8-bit"}
        height="20px"
        width="20px"
      />
    </div>
  ) : (
    <img
      className="instrument-icon"
      src={instrumentIcons[instrument]}
      alt={instrument}
      height="20px"
      width="20px"
      onClick={() => !isPlaying && setIsSelecting(true)}
    />
  );
};

export default TrackControls;
