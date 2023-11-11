import * as Tone from "tone";
import { TrackType, NoteType } from "./types";

type MidiEditorProps = {
  track: TrackType;
  setTracks: React.Dispatch<React.SetStateAction<TrackType[]>>;
  height: number; // needed?
  scaleWidth: number;
  startPosition: number;
};

const MidiEditor = ({ track, setTracks, scaleWidth, startPosition }: MidiEditorProps): JSX.Element => {
  const notes: JSX.Element[] = [];

  if (track.notes.length) {
    // const noteRange: number = track.maxNote - track.minNote;
    const noteHeight: number = 24;

    for (const note of track.notes) {
      const noteLeft: number = Math.round(note.noteTime * scaleWidth) + 1;
      const noteWidth: number = Math.round(Number(note.duration) * scaleWidth);
      const noteTop: number = (108 - note.midiNum) * noteHeight;

      notes.push(<EditorNote key={note.id} noteID={note.id} left={noteLeft} top={noteTop} width={noteWidth} height={noteHeight} />);
    }
  }

  const addNote = (name: string, midiNum: number, duration: string | number, noteTime: number, velocity: number) => {
    const noteID: number = Tone.Transport.schedule((time: number) => {
      track.instrument.triggerAttackRelease(name, duration, time, velocity);
    }, noteTime);

    const newNotes: NoteType[] = [...track.notes, { id: noteID, name, midiNum, duration, noteTime, velocity }];

    const minNote: number = Math.min(track.minNote, midiNum);
    const maxNote: number = Math.max(track.maxNote, midiNum);

    const newTrack = { ...track, notes: newNotes, minNote, maxNote };

    setTracks((prevTracks) => {
      const newTracks: TrackType[] = prevTracks.map((tr) => (tr.id === track.id ? newTrack : tr));
      return newTracks;
    });
  };

  const removeNote = (noteID: number) => {
    // add handling for if note doesn't exist
    Tone.Transport.clear(noteID);

    const newNotes: NoteType[] = track.notes.filter((note) => note.id !== noteID);

    const newNoteRange: { minNote: number; maxNote: number } = newNotes.reduce(
      (range, note) => {
        const min: number = Math.min(range.minNote, note.midiNum);
        const max: number = Math.max(range.maxNote, note.midiNum);

        return { minNote: min, maxNote: max };
      },
      { minNote: 128, maxNote: -1 }
    );

    const newTrack = { ...track, notes: newNotes, minNote: newNoteRange.minNote, maxNote: newNoteRange.maxNote };

    setTracks((prevTracks) => {
      const newTracks: TrackType[] = prevTracks.map((tr) => (tr.id === track.id ? newTrack : tr));
      return newTracks;
    });
  };

  const addRemoveNote = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const target = e.target as HTMLDivElement;

    if (target.classList.contains("editor-note")) {
      removeNote(Number(target.id));
    } else {
      const clickY: number = Math.round(target.getBoundingClientRect().bottom) - e.clientY;
      const noteNum: number = Math.floor(clickY / 24);

      // Use mapping object instead? If so, change in InstrumentControls as well
      const pitches: string[] = ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"];
      const pitch: string = pitches[noteNum % 12];
      const octave: string = String(noteNum < 3 ? 0 : Math.floor((noteNum - 3) / 12) + 1);
      const noteName: string = pitch + octave;

      addNote(noteName, noteNum + 21, 0.25, startPosition, 0.6);
    }
  };

  return (
    <div className="midi-editor" onDoubleClick={(e) => addRemoveNote(e)}>
      {notes}
    </div>
  );
};

type EditorNoteProps = {
  noteID: number;
  left: number;
  top: number;
  width: number;
  height: number;
};

const EditorNote = ({ noteID, left, top, width, height }: EditorNoteProps): JSX.Element => {
  return <div className="editor-note" id={String(noteID)} style={{ left, top, width, height }} />;
};

export default MidiEditor;
