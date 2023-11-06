import { useState, useEffect, useRef, useContext } from "react";
import * as Tone from "tone";
import { TrackType, NoteType } from "./types";
import TracksContext from "./TracksContext";
import createInstrument from "./instruments/createInstrument";
import instrumentIcons from "./instruments/instrumentIcons";
import { ReactComponent as GlobeIcon } from "./assets/icons/globe.svg";

type TrackControlsProps = {
  trackHeight: number;
  isPlaying: boolean;
};

const TrackControls = ({ trackHeight, isPlaying }: TrackControlsProps): JSX.Element => {
  const { tracks, setTracks } = useContext(TracksContext)!;
  const [soloTracks, setSoloTracks] = useState<boolean[]>(() => {
    const soloTracks: boolean[] = [];
    for (let i = 0; i < tracks.length; i++) {
      soloTracks.push(false);
    }
    return soloTracks;
  });
  const [mutedTracks, setMutedTracks] = useState<boolean[]>(() => {
    const mutedTracks: boolean[] = [];
    for (let i = 0; i < tracks.length; i++) {
      mutedTracks.push(false);
    }
    return mutedTracks;
  });

  useEffect(() => {
    const soloExists: boolean = soloTracks.includes(true);

    for (let i = 0; i < tracks.length; i++) {
      const panVolNode: Tone.PanVol | undefined = tracks[i].panVol;

      if (panVolNode) {
        const isSolo: boolean = soloTracks[i];
        const isManuallyMuted: boolean = mutedTracks[i];

        // simplify?
        if (soloExists) {
          if (isSolo) {
            // unmute
            panVolNode.mute = false;
          } else {
            // mute
            panVolNode.mute = true;
          }
        } else {
          // unmute, unless manually muted
          if (!isManuallyMuted) {
            panVolNode.mute = false;
          } else {
            panVolNode.mute = true;
          }
        }
      }
    }
  }, [soloTracks]);

  const trackControls: JSX.Element[] = [];

  //   possibly put track id on actual tracks object instead and use that here and in Tracks component
  for (let i = 0; i < tracks.length; i++) {
    trackControls.push(
      <TrackControl
        key={i}
        track={tracks[i]}
        trackID={i}
        trackHeight={trackHeight}
        setTracks={setTracks}
        isSolo={soloTracks[i]}
        setSoloTracks={setSoloTracks}
        isMuted={mutedTracks[i]}
        setMutedTracks={setMutedTracks}
        isPlaying={isPlaying}
      />
    );
  }

  return <div className="track-controls">{trackControls}</div>;
};

type TrackControlProps = {
  track: TrackType;
  trackID: number;
  trackHeight: number;
  setTracks: React.Dispatch<React.SetStateAction<TrackType[]>>;
  isSolo: boolean;
  setSoloTracks: React.Dispatch<React.SetStateAction<boolean[]>>;
  isMuted: boolean;
  setMutedTracks: React.Dispatch<React.SetStateAction<boolean[]>>;
  isPlaying: boolean;
};

const TrackControl = ({
  track,
  trackID,
  trackHeight,
  setTracks,
  isSolo,
  setSoloTracks,
  isMuted,
  setMutedTracks,
  isPlaying,
}: TrackControlProps): JSX.Element => {
  const [volume, setVolume] = useState(track.panVol.volume.value); // set these initials based on settings for each song (see Workspace component)
  const [pan, setPan] = useState(0); // set these initials based on settings for each song (see Workspace component)
  const [trackName, setTrackName] = useState(track.name || `Track ${trackID}`);
  const [instrument, setInstrument] = useState(track.instrumentName);
  const [isGlobal, setIsGlobal] = useState(false);

  const handleMute = () => {
    setMutedTracks((prevMutedTracks) => {
      return prevMutedTracks.map((isMuted, i) => (i === trackID ? !isMuted : isMuted));
    });
  };

  const handleSolo = () => {
    setSoloTracks((prevSoloTracks) => {
      return prevSoloTracks.map((isSolo, i) => (i === trackID ? !isSolo : isSolo));
    });
  };

  useEffect(() => {
    // how come when I tried to do this in the Workspace component instead, it resulted in two nodes for each track where the controls only affected one?
    track.instrument.chain(track.panVol, Tone.Destination);
  }, []);

  useEffect(() => {
    if (!isSolo) track.panVol.mute = isMuted;
  }, [isMuted]);

  // useEffect(() => {
  //   //  TODO: Implement using the shared state. Either tracks or another.
  // }, [isGlobal]);

  useEffect(() => {
    track.panVol.volume.value = volume;
  }, [volume]);

  useEffect(() => {
    track.panVol.pan.value = pan / 8;
  }, [pan]);

  useEffect(() => {
    if (track.instrumentName !== instrument) {
      track.instrument.dispose();

      const { instrument: newInstrument } = createInstrument(instrument);
      newInstrument.chain(track.panVol);

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
        panVol: track.panVol, // dispose and make new panVol instead?
        notes: newNotes,
        minNote: track.minNote,
        maxNote: track.maxNote,
      };

      // TODO: Avoid repeating this. Make function?
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
      <InstrumentSelect instrument={instrument} setInstrument={setInstrument} trackID={trackID} isPlaying={isPlaying} />
      <input
        className="volume-fader"
        type="range"
        min="-40"
        max="8"
        value={volume}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVolume(Number(e.target.value))}
        onDoubleClick={() => setVolume(-16)}
      />
      <input
        className="pan-control"
        type="range"
        min="-8"
        max="8"
        value={pan}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPan(Number(e.target.value))}
        onDoubleClick={() => setPan(0)}
      />
      <div className="track-control-btn-container">
        <label>
          <input type="checkbox" className="track-control-chk" checked={isMuted} onChange={handleMute} />
          <div className="mute-btn">
            <div className="track-control-btn-content mute-btn-text">M</div>
          </div>
        </label>
        <label>
          <input type="checkbox" className="track-control-chk" checked={isSolo} onChange={handleSolo} />
          <div className="solo-btn">
            <div className="track-control-btn-content solo-btn-text">S</div>
          </div>
        </label>
        <label>
          <input type="checkbox" className="track-control-chk" checked={isGlobal} onChange={() => setIsGlobal(!isGlobal)} />
          <div className="global-btn">
            <GlobeIcon className="global-btn-icon" width="16" height="16" />
          </div>
        </label>
      </div>
    </div>
  );
};

type InstrumentSelectProps = {
  instrument: string;
  setInstrument: React.Dispatch<React.SetStateAction<string>>;
  trackID: number;
  isPlaying: boolean; // Less prop drilling? Context?
};

const InstrumentSelect = ({ instrument, setInstrument, trackID, isPlaying }: InstrumentSelectProps): JSX.Element => {
  const [isSelecting, setIsSelecting] = useState(false);
  const initialClick = useRef(false);

  const handleClick = (e: MouseEvent) => {
    if (initialClick.current) {
      initialClick.current = false;
      return;
    }

    const selectedElement = e.target as HTMLElement;

    if (selectedElement.classList.contains("instrument-select")) {
      return;
    } else if (selectedElement.classList.contains("instrument-option") && Number(selectedElement.dataset.trackid) === trackID) {
      const instrumentName: string | undefined = selectedElement.dataset.instrument;
      if (instrumentName) setInstrument(instrumentName);
    }

    setIsSelecting(false);
  };

  useEffect(() => {
    if (isSelecting) {
      initialClick.current = true;
      document.addEventListener("click", handleClick);
    } else {
      initialClick.current = false;
      document.removeEventListener("click", handleClick);
    }

    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, [isSelecting]);

  return (
    <>
      <img
        className="instrument-icon"
        src={instrumentIcons[instrument]}
        alt={instrument}
        height="20px"
        width="20px"
        onClick={() => !isPlaying && !isSelecting && setIsSelecting(true)}
      />
      {isSelecting && (
        <div className="instrument-select">
          <img
            className="instrument-option"
            data-instrument="guitar"
            data-trackid={trackID}
            src={instrumentIcons["guitar"]}
            alt={"Clean Guitar"}
            height="20px"
            width="20px"
          />
          <img
            className="instrument-option"
            data-instrument="guitarDist"
            data-trackid={trackID}
            src={instrumentIcons["guitarDist"]}
            alt={"Distorted Guitar"}
            height="20px"
            width="20px"
          />
          <img
            className="instrument-option"
            data-instrument="bass"
            data-trackid={trackID}
            src={instrumentIcons["bass"]}
            alt={"Bass"}
            height="20px"
            width="20px"
          />
          <img
            className="instrument-option"
            data-instrument="piano"
            data-trackid={trackID}
            src={instrumentIcons["piano"]}
            alt={"Piano"}
            height="20px"
            width="20px"
          />
          <img
            className="instrument-option"
            data-instrument="drums"
            data-trackid={trackID}
            src={instrumentIcons["drums"]}
            alt={"Drums"}
            height="20px"
            width="20px"
          />
          <img
            className="instrument-option"
            data-instrument="8-bit"
            data-trackid={trackID}
            src={instrumentIcons["8-bit"]}
            alt={"8-bit"}
            height="20px"
            width="20px"
          />
        </div>
      )}
    </>
  );
};

export default TrackControls;
