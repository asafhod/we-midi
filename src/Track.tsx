import * as Tone from "tone";
import { useContext } from "react";
import TracksContext from "./TracksContext";
import { NoteType, TrackType } from "./types";

type TrackProps = {
  trackID: number;
};

const Track = ({ trackID }: TrackProps): JSX.Element => {
  // TODO: change to use Redux state instead of context API
  const { tracks, setTracks } = useContext(TracksContext)!;

  // ---Move to midi editor component---------------------
  const addNote = (name: string, duration: string, noteTime: number, velocity: number) => {
    let track: TrackType = tracks[trackID];
    const instrument: Tone.Sampler = track.instrument;

    const noteID: number = Tone.Transport.schedule((time: number) => {
      instrument.triggerAttackRelease(name, duration, time, velocity);
    }, noteTime);

    const notes: NoteType[] = [...track.notes, { noteID, name, duration, noteTime, velocity }];
    track = { ...track, notes };

    const newTracks: TrackType[] = tracks.map((tr, i) => {
      if (i === trackID) {
        return track;
      }

      return tr;
    });

    setTracks(newTracks);
  };

  const removeNote = (noteID: number) => {
    // add handling for if note doesn't exist
    Tone.Transport.clear(noteID);

    let track: TrackType = tracks[trackID];
    const notes: NoteType[] = track.notes.filter((note) => note.noteID !== noteID);

    track = { ...track, notes };

    const newTracks: TrackType[] = tracks.map((tr, i) => {
      if (i === trackID) {
        return track;
      }

      return tr;
    });

    setTracks(newTracks);
  };
  // -----------------------------------------------------

  return (
    <div>
      {tracks[trackID].name || `Track ${trackID}`}
      <button type="button" onClick={() => addNote("C3", "4n", Tone.Transport.toSeconds("2:0:0"), 0.6)}>
        Add C Note
      </button>
      <button type="button" onClick={() => removeNote(tracks[trackID].notes[tracks[trackID].notes.length - 1].noteID)}>
        Remove Newest Note
      </button>
    </div>
  );
};

export default Track;
