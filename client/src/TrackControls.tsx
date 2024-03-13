import { useState, useEffect, useRef, useMemo } from "react";
import * as Tone from "tone";
import { TrackControlType, TrackType, NoteType } from "./types";
import createInstrument from "./instruments/createInstrument";
import instrumentIcons from "./instruments/instrumentIcons";
import { ReactComponent as GlobeIcon } from "./assets/icons/globe.svg";

// TODO: Make sure the change from trackVols+soloTracks to trackControls didn't break anything, especially deps
// TODO: Set up Pan so it uses trackControls
// TODO: Make sure all the useEffects are safe, and streamline how you're handling trackData. Is the trackVol setting in TrackControl okay?

type TrackControlsProps = {
  tracks: TrackType[];
  setTracks: React.Dispatch<React.SetStateAction<TrackType[]>>;
  trackControls: TrackControlType[];
  setTrackControls: React.Dispatch<React.SetStateAction<TrackControlType[]>>;
  toggleTrackSolo: (trackID: number) => void;
  deleteTrack: (trackID: number) => void;
  trackHeight: number;
  isPlaying: boolean;
};

const TrackControls = ({
  tracks,
  setTracks,
  trackControls,
  setTrackControls,
  toggleTrackSolo,
  deleteTrack,
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

    deleteTrack(trackID);
  };

  // TODO: Narrow down so only re-calcs specifically if a solo change occurs? Such as soloing/unsoloing, or deleting the only solo'd track, maybe even more specific.
  const soloExists: boolean = useMemo(() => trackControls.some((trackControl) => trackControl.solo), [trackControls]);

  const trackControlComponents: JSX.Element[] = [];

  // use trackControls here instead?
  for (const track of tracks) {
    // efficient enough?
    const trackControl: TrackControlType | undefined = trackControls.find((trackControl) => trackControl.id === track.id);

    if (!trackControl) throw new Error("Invalid Track Control settings");

    trackControlComponents.push(
      <TrackControl
        key={track.id}
        track={track}
        trackHeight={trackHeight}
        setTracks={setTracks}
        soloExists={soloExists}
        solo={trackControl.solo}
        toggleTrackSolo={toggleTrackSolo}
        volume={trackControl.volume}
        muted={trackControl.muted}
        setTrackControls={setTrackControls}
        isPlaying={isPlaying}
      />
    );
  }

  return (
    <div className="track-controls" onContextMenu={(e) => handleRightClick(e)}>
      {trackControlComponents}
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
  setTrackControls: React.Dispatch<React.SetStateAction<TrackControlType[]>>;
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
  setTrackControls,
  isPlaying,
}: TrackControlProps): JSX.Element => {
  const [pan, setPan] = useState(track.panVol.pan.value * 8); // cleaner way?
  const [trackName, setTrackName] = useState(track.name);
  const [instrument, setInstrument] = useState(track.instrumentName);
  const [isGlobal, setIsGlobal] = useState(false);

  const handleMute = () => {
    setTrackControls((prevTrackControls) => {
      return prevTrackControls.map((trackControl) =>
        trackControl.id === track.id ? { ...trackControl, muted: !trackControl.muted } : trackControl
      );
    });
  };

  // useEffect(() => {
  //   //  TODO: Implement using the shared state. Either tracks or another.
  // }, [isGlobal]);

  useEffect(() => {
    // if volume slider is at lowest value, adjust it to -Infinity so Tone can silence the track
    const adjustedVolume: number = volume === -40 ? -Infinity : volume;

    if (soloExists) {
      // Unmute track's panVol if the track is soloed, mute it if it is not
      track.panVol.volume.value = solo ? adjustedVolume : -Infinity;
    } else {
      // No track is soloed. Unmute the track's panVol, unless the track has been manually muted in the UI.
      track.panVol.volume.value = muted ? -Infinity : adjustedVolume;
    }
  }, [volume, muted, solo, soloExists, track.panVol.volume]);

  useEffect(() => {
    track.panVol.pan.value = pan / 8;
  }, [pan, track.panVol.pan]);

  useEffect(() => {
    const changeInstrument = async () => {
      if (track.instrumentName !== instrument) {
        track.instrument.dispose();

        const newInstrument: Tone.Sampler = createInstrument(instrument);
        newInstrument.chain(track.panVol);

        await Tone.loaded();

        const newNotes: NoteType[] = [];

        for (const note of track.notes) {
          const { clientNoteID: id, noteID, name, midiNum, duration, noteTime, velocity } = note;
          Tone.Transport.clear(id);

          const newID: number = Tone.Transport.schedule((time) => {
            newInstrument.triggerAttackRelease(name, duration, time, velocity);
          }, noteTime);

          const newNote: NoteType = { clientNoteID: newID, noteID, name, midiNum, duration, noteTime, velocity };
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
    };

    try {
      changeInstrument();
    } catch (error) {
      console.error(error);
    }
  }, [instrument, track, setTracks]);

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
  }, [trackName, track, setTracks]);

  return (
    <div className="track-control" data-trackid={track.id} style={{ height: trackHeight }}>
      <input
        type="text"
        name="track-name"
        className="track-name"
        maxLength={15}
        value={trackName}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTrackName(e.target.value)}
        onBlur={(e: React.FocusEvent<HTMLInputElement, Element>) => e.target.value.trim() === "" && setTrackName(`Track ${track.id}`)}
      />
      <InstrumentSelect instrument={instrument} setInstrument={setInstrument} trackID={track.id} isPlaying={isPlaying} />
      <input
        name="volume-fader"
        className="volume-fader"
        type="range"
        min="-40"
        max="8"
        value={volume}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setTrackControls((prevTrackControls) => {
            return prevTrackControls.map((trackControl) =>
              trackControl.id === track.id ? { ...trackControl, volume: Number(e.target.value) } : trackControl
            );
          })
        }
        onDoubleClick={() =>
          setTrackControls((prevTrackControls) => {
            return prevTrackControls.map((trackControl) =>
              trackControl.id === track.id ? { ...trackControl, volume: -16 } : trackControl
            );
          })
        }
      />
      <input
        name="pan-control"
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
          <input type="checkbox" name="mute-chk" className="track-control-chk" checked={muted} onChange={handleMute} />
          <div className="mute-btn">
            <div className="track-control-btn-content mute-btn-text">M</div>
          </div>
        </label>
        <label>
          <input
            type="checkbox"
            name="solo-chk"
            className="track-control-chk"
            checked={solo}
            onChange={() => toggleTrackSolo(track.id)}
          />
          <div className="solo-btn">
            <div className="track-control-btn-content solo-btn-text">S</div>
          </div>
        </label>
        <label>
          <input
            type="checkbox"
            name="global-revert-btn"
            className="track-control-chk"
            checked={isGlobal}
            onChange={() => setIsGlobal(!isGlobal)}
          />
          <div className="global-revert-btn">
            <GlobeIcon className="global-revert-btn-icon" width="16" height="16" />
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

  useEffect(() => {
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
  }, [isSelecting, trackID, setInstrument]);

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
            data-instrument="g"
            data-trackid={trackID}
            src={instrumentIcons["g"]}
            alt={"Clean Guitar"}
            height="20px"
            width="20px"
          />
          <img
            className="instrument-option"
            data-instrument="e"
            data-trackid={trackID}
            src={instrumentIcons["e"]}
            alt={"Distorted Guitar"}
            height="20px"
            width="20px"
          />
          <img
            className="instrument-option"
            data-instrument="b"
            data-trackid={trackID}
            src={instrumentIcons["b"]}
            alt={"Bass"}
            height="20px"
            width="20px"
          />
          <img
            className="instrument-option"
            data-instrument="p"
            data-trackid={trackID}
            src={instrumentIcons["p"]}
            alt={"Piano"}
            height="20px"
            width="20px"
          />
          <img
            className="instrument-option"
            data-instrument="d"
            data-trackid={trackID}
            src={instrumentIcons["d"]}
            alt={"Drums"}
            height="20px"
            width="20px"
          />
          <img
            className="instrument-option"
            data-instrument="c"
            data-trackid={trackID}
            src={instrumentIcons["c"]}
            alt={"Chiptune"}
            height="20px"
            width="20px"
          />
        </div>
      )}
    </>
  );
};

export default TrackControls;
