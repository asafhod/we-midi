// import * as Tone from "tone";
import { useContext } from "react";
import TracksContext from "./TracksContext";
// import { NoteType, TrackType } from "./types";

type TrackProps = {
  trackID: number;
  width: number;
  height: number;
  scaleWidth: number;
};

const Track = ({ trackID, width, height, scaleWidth }: TrackProps): JSX.Element => {
  // TODO: change to use Redux state instead of context API
  // const { tracks, setTracks } = useContext(TracksContext)!;
  const { tracks } = useContext(TracksContext)!;

  const notes: JSX.Element[] = [];

  if (tracks[trackID].notes.length) {
    const { minNote, maxNote } = tracks[trackID];
    const noteRange: number = maxNote - minNote;
    const heightWithoutBorder: number = height - 2;
    const noteHeight: number = Math.min(Math.round(noteRange === 0 ? heightWithoutBorder / 20 : heightWithoutBorder / noteRange), 10);
    const availableTrackHeight: number = heightWithoutBorder - noteHeight;

    for (const note of tracks[trackID].notes) {
      const noteLeft: number = Math.round(note.noteTime * scaleWidth);
      const noteWidth: number = Math.round(Number(note.duration) * scaleWidth);

      const normalizedNotePosition: number = noteRange === 0 ? 0.5 : 1 - (note.midiNum - minNote) / noteRange;
      const noteTop: number = Math.round(normalizedNotePosition * availableTrackHeight);

      notes.push(<TrackNote key={note.noteID} left={noteLeft} top={noteTop} width={noteWidth} height={noteHeight} />);
    }
  }

  // ---Move to midi editor component---------------------
  // const addNote = (name: string, midiNum: number, duration: string | number, noteTime: number, velocity: number) => {
  //   let track: TrackType = tracks[trackID];
  //   const instrument: Tone.Sampler = track.instrument;

  //   const noteID: number = Tone.Transport.schedule((time: number) => {
  //     instrument.triggerAttackRelease(name, duration, time, velocity);
  //   }, noteTime);

  //   const notes: NoteType[] = [...track.notes, { noteID, name, midiNum, duration, noteTime, velocity }];

  //   const minNote: number = Math.min(track.minNote, midiNum);
  //   const maxNote: number = Math.max(track.maxNote, midiNum);

  //   track = { ...track, notes, minNote, maxNote };

  //   const newTracks: TrackType[] = tracks.map((tr, i) => {
  //     if (i === trackID) {
  //       return track;
  //     }

  //     return tr;
  //   });

  //   setTracks(newTracks);
  // };

  // const removeNote = (noteID: number) => {
  //   // add handling for if note doesn't exist
  //   Tone.Transport.clear(noteID);

  //   let track: TrackType = tracks[trackID];
  //   const notes: NoteType[] = track.notes.filter((note) => note.noteID !== noteID);

  //   const newNoteRange: { minNote: number; maxNote: number } = notes.reduce(
  //     (range, note) => {
  //       const min: number = Math.min(range.minNote, note.midiNum);
  //       const max: number = Math.max(range.maxNote, note.midiNum);

  //       return { minNote: min, maxNote: max };
  //     },
  //     { minNote: 128, maxNote: -1 }
  //   );

  //   track = { ...track, notes, minNote: newNoteRange.minNote, maxNote: newNoteRange.maxNote };

  //   const newTracks: TrackType[] = tracks.map((tr, i) => {
  //     if (i === trackID) {
  //       return track;
  //     }

  //     return tr;
  //   });

  //   setTracks(newTracks);
  // };
  // -----------------------------------------------------

  return (
    <div className="track" style={{ width, height }}>
      {notes}
      {/* <div>
        {tracks[trackID].name || `Track ${trackID}`}
        <button type="button" onClick={() => addNote("C3", 48, 0.25, Tone.Transport.toSeconds("2:0:0"), 0.6)}>
          Add C Note
        </button>
        <button type="button" onClick={() => removeNote(tracks[trackID].notes[tracks[trackID].notes.length - 1].noteID)}>
          Remove Newest Note
        </button>
      </div> */}
    </div>
  );
};

type TrackNoteProps = {
  left: number;
  top: number;
  width: number;
  height: number;
};

const TrackNote = ({ left, top, width, height }: TrackNoteProps): JSX.Element => {
  return <div className="track-note" style={{ left, top, width, height }} onClick={() => console.log(left, width)} />;
};

export default Track;
