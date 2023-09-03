// import * as Tone from "tone";
import { useContext } from "react";
import TracksContext from "./TracksContext";
// import { NoteType, TrackType } from "./types";

type TrackProps = {
  trackID: number;
  width: number;
  scaleWidth: number;
};

const Track = ({ trackID, width, scaleWidth }: TrackProps): JSX.Element => {
  // TODO: change to use Redux state instead of context API
  // const { tracks, setTracks } = useContext(TracksContext)!;
  const { tracks } = useContext(TracksContext)!;

  const notes: JSX.Element[] = [];

  for (const note of tracks[trackID].notes) {
    const left: number = note.noteTime * 100 * scaleWidth;
    const top: number = (127 - note.midi) * 5;
    const width: number = Number(note.duration) * 50 * scaleWidth;
    notes.push(<div key={note.noteID} className="note" style={{ left, top, width }}></div>);
  }

  // ---Move to midi editor component---------------------
  // const addNote = (name: string, duration: string, noteTime: number, velocity: number) => {
  //   let track: TrackType = tracks[trackID];
  //   const instrument: Tone.Sampler = track.instrument;

  //   const noteID: number = Tone.Transport.schedule((time: number) => {
  //     instrument.triggerAttackRelease(name, duration, time, velocity);
  //   }, noteTime);

  //   const notes: NoteType[] = [...track.notes, { noteID, name, duration, noteTime, velocity }];
  //   track = { ...track, notes };

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

  //   track = { ...track, notes };

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
    <div className="track" style={{ width: width }}>
      {notes}
    </div>
    // <div>
    //   {tracks[trackID].name || `Track ${trackID}`}
    //   {/* <button type="button" onClick={() => addNote("C3", "4n", Tone.Transport.toSeconds("2:0:0"), 0.6)}>
    //     Add C Note
    //   </button>
    //   <button type="button" onClick={() => removeNote(tracks[trackID].notes[tracks[trackID].notes.length - 1].noteID)}>
    //     Remove Newest Note
    //   </button> */}
    // </div>
  );
};

export default Track;
