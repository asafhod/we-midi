import { useState, useEffect, useRef, useMemo } from "react";
import * as Tone from "tone";
import { TrackVol, SoloTrack, TrackType, NoteType } from "./types";
import createInstrument from "./instruments/createInstrument";
import instrumentIcons from "./instruments/instrumentIcons";
import { ReactComponent as GlobeIcon } from "./assets/icons/globe.svg";

// TODO: Make sure all the useEffects are safe, and streamline how you're handling trackData. Is the trackVol setting in TrackControl okay?
type TrackControlsProps = {
  tracks: TrackType[];
  setTracks: React.Dispatch<React.SetStateAction<TrackType[]>>;
  trackVols: TrackVol[];
  setTrackVols: React.Dispatch<React.SetStateAction<TrackVol[]>>;
  soloTracks: SoloTrack[];
  toggleTrackSolo: (trackID: number) => void;
  removeTrack: (trackID: number) => void;
  trackHeight: number;
  isPlaying: boolean;
};

const TrackControls = ({
  tracks,
  setTracks,
  trackVols,
  setTrackVols,
  soloTracks,
  toggleTrackSolo,
  removeTrack,
  trackHeight,
  isPlaying,
}: TrackControlsProps): JSX.Element => {
  const handleRightClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.preventDefault();

    let target: HTMLElement | null = e.target as HTMLElement;
    let trackID: number = 0;

    while (!trackID) {
      if (target.classList.contains("track-controls")) return;

      if (target.dataset.trackid) {
        trackID = Number(target.dataset.trackid);
        if (!trackID || trackID < 0) return;
      } else {
        target = target.parentElement;
        if (!target) return;
      }
    }

    removeTrack(trackID);
  };

  // TODO: Narrow down so only re-calcs specifically if a solo change occurs?
  const soloExists: boolean = useMemo(() => soloTracks.some((track) => track.solo), [soloTracks]);

  const trackControls: JSX.Element[] = [];

  for (const track of tracks) {
    // use trackVols here instead?
    // efficient enough?
    const trackVol: TrackVol | undefined = trackVols.find((tr) => tr.id === track.id);
    const soloTrack: SoloTrack | undefined = soloTracks.find((tr) => tr.id === track.id);

    if (!trackVol || !soloTrack) throw new Error("Invalid Track Control settings");

    trackControls.push(
      <TrackControl
        key={track.id}
        track={track}
        trackHeight={trackHeight}
        setTracks={setTracks}
        soloExists={soloExists}
        solo={soloTrack.solo}
        toggleTrackSolo={toggleTrackSolo}
        volume={trackVol.volume}
        muted={trackVol.muted}
        setTrackVols={setTrackVols}
        isPlaying={isPlaying}
      />
    );
  }

  return (
    <div className="track-controls" onContextMenu={(e) => handleRightClick(e)}>
      {trackControls}
    </div>
  );
};

type TrackControlProps = {
  track: TrackType;
  trackHeight: number;
  setTracks: React.Dispatch<React.SetStateAction<TrackType[]>>;
  soloExists: boolean;
  solo: boolean;
  toggleTrackSolo: (trackID: number) => void;
  volume: number;
  muted: boolean;
  setTrackVols: React.Dispatch<React.SetStateAction<TrackVol[]>>;
  isPlaying: boolean;
};

const TrackControl = ({
  track,
  trackHeight,
  setTracks,
  soloExists,
  solo,
  toggleTrackSolo,
  volume,
  muted,
  setTrackVols,
  isPlaying,
}: TrackControlProps): JSX.Element => {
  const [pan, setPan] = useState(track.panVol.pan.value * 8); // cleaner way?
  const [trackName, setTrackName] = useState(track.name);
  const [instrument, setInstrument] = useState(track.instrumentName);
  const [isGlobal, setIsGlobal] = useState(false);

  const handleMute = () => {
    setTrackVols((prevTrackVols) => {
      return prevTrackVols.map((tr) => (tr.id === track.id ? { ...tr, muted: !tr.muted } : tr));
    });
  };

  // useEffect(() => {
  //   //  TODO: Implement using the shared state. Either tracks or another.
  // }, [isGlobal]);

  useEffect(() => {
    if (soloExists) {
      // Unmute track's panVol if the track is soloed, mute it if it is not
      track.panVol.volume.value = solo ? volume : -Infinity;
    } else {
      // No track is soloed. Unmute the track's panVol, unless the track has been manually muted in the UI.
      track.panVol.volume.value = muted ? -Infinity : volume;
    }
  }, [volume, muted, solo, soloExists, track.panVol.volume]);

  useEffect(() => {
    track.panVol.pan.value = pan / 8;
  }, [pan, track.panVol.pan]);

  useEffect(() => {
    if (track.instrumentName !== instrument) {
      track.instrument.dispose();

      const { instrument: newInstrument } = createInstrument(instrument);
      newInstrument.chain(track.panVol);

      const newNotes: NoteType[] = [];

      for (const note of track.notes) {
        const { id: noteID, name, midiNum, duration, noteTime, velocity } = note;
        Tone.Transport.clear(noteID);

        const newNoteID: number = Tone.Transport.schedule((time) => {
          newInstrument.triggerAttackRelease(name, duration, time, velocity);
        }, noteTime);

        const newNote: NoteType = { id: newNoteID, name, midiNum, duration, noteTime, velocity };
        newNotes.push(newNote);
      }

      const newTrack: TrackType = {
        id: track.id,
        name: track.name,
        instrumentName: instrument,
        instrument: newInstrument,
        panVol: track.panVol, // dispose and make new panVol instead?
        notes: newNotes,
        minNote: track.minNote,
        maxNote: track.maxNote,
      };

      setTracks((prevTracks) => {
        const newTracks: TrackType[] = prevTracks.map((tr) => (tr.id === track.id ? newTrack : tr));
        return newTracks;
      });
    }
  }, [instrument]);

  useEffect(() => {
    // Will likely need to have a state on the component for the Track name, then only update the global name onBlur
    //    This avoids issue where name could be "" for a user if another user clears the name and hasn't blurred out yet
    //    This also avoids global state changes for each letter of the name change, only does one for the final when blurred
    if (trackName !== track.name) {
      setTracks((prevTracks) => {
        const newTrack: TrackType = { ...track, name: trackName };

        const newTracks: TrackType[] = prevTracks.map((tr) => (tr.id === track.id ? newTrack : tr));
        return newTracks;
      });
    }
  }, [trackName]);

  return (
    <div className="track-control" data-trackid={track.id} style={{ height: trackHeight }}>
      <input
        className="track-name"
        type="text"
        maxLength={15}
        value={trackName}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTrackName(e.target.value)}
        onBlur={(e: React.FocusEvent<HTMLInputElement, Element>) => e.target.value.trim() === "" && setTrackName(`Track ${track.id}`)}
      />
      <InstrumentSelect instrument={instrument} setInstrument={setInstrument} trackID={track.id} isPlaying={isPlaying} />
      <input
        className="volume-fader"
        type="range"
        min="-40"
        max="8"
        value={volume}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setTrackVols((prevTrackVols) => {
            return prevTrackVols.map((trackVol) =>
              trackVol.id === track.id ? { ...trackVol, volume: Number(e.target.value) } : trackVol
            );
          })
        }
        onDoubleClick={() =>
          setTrackVols((prevTrackVols) => {
            return prevTrackVols.map((trackVol) => (trackVol.id === track.id ? { ...trackVol, volume: -16 } : trackVol));
          })
        }
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
          <input type="checkbox" className="track-control-chk" checked={muted} onChange={handleMute} />
          <div className="mute-btn">
            <div className="track-control-btn-content mute-btn-text">M</div>
          </div>
        </label>
        <label>
          <input type="checkbox" className="track-control-chk" checked={solo} onChange={() => toggleTrackSolo(track.id)} />
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
