import { useLayoutEffect } from "react";
import { useContext } from "react";
import TracksContext from "./TracksContext";
import * as Tone from "tone";
import { TrackType, NoteType } from "./types";
import { noteNames } from "./noteNames";

type MidiEditorProps = {
  track: TrackType;
  setTracks: React.Dispatch<React.SetStateAction<TrackType[]>>;
  widthFactor: number;
  startPosition: number;
  setAutoscrollBlocked: React.Dispatch<React.SetStateAction<boolean>>;
};

const MidiEditor = ({ track, setTracks, widthFactor, startPosition, setAutoscrollBlocked }: MidiEditorProps): JSX.Element => {
  const { ws } = useContext(TracksContext)!;

  const notes: JSX.Element[] = [];

  if (track.notes.length) {
    // const noteRange: number = track.maxNote - track.minNote;
    const noteHeight: number = 24;

    for (const note of track.notes) {
      const noteLeft: number = Math.round(note.noteTime * widthFactor) + 1;
      const noteWidth: number = Math.max(Math.round(Number(note.duration) * widthFactor), 1);
      const noteTop: number = (108 - note.midiNum) * noteHeight;

      notes.push(
        <EditorNote
          key={note.clientNoteID}
          noteID={note.clientNoteID}
          left={noteLeft}
          top={noteTop}
          width={noteWidth}
          height={noteHeight}
        />
      );
    }
  }

  const addNote = (name: string, midiNum: number, duration: string | number, noteTime: number, velocity: number) => {
    if (ws) {
      const clientNoteID: number = Tone.Transport.schedule((time: number) => {
        track.instrument.triggerAttackRelease(name, duration, time, velocity);
      }, noteTime);

      const newNotes: NoteType[] = [...track.notes, { clientNoteID, noteID: 0, name, midiNum, duration, noteTime, velocity }];

      const minNote: number = Math.min(track.minNote, midiNum);
      const maxNote: number = Math.max(track.maxNote, midiNum);

      const newTrack: TrackType = { ...track, notes: newNotes, minNote, maxNote };

      setTracks((currTracks: TrackType[]) => {
        return currTracks.map((tr: TrackType) => (tr.id === track.id ? newTrack : tr));
      });

      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              action: "addNote",
              data: { trackID: track.id, clientNoteID, midiNum, duration, noteTime, velocity },
            })
          );
        } else {
          throw new Error("WebSocket is not open");
        }
      } catch (error) {
        console.error(`Error adding note: ${error}`);

        // close the connection with Close Code 4400 for generic client-side error
        ws.close(4400);
      }
    }
  };

  const removeNote = (noteID: number) => {
    // add handling for if note doesn't exist
    Tone.Transport.clear(noteID);

    const newNotes: NoteType[] = track.notes.filter((note) => note.clientNoteID !== noteID);

    const newNoteRange: { minNote: number; maxNote: number } = newNotes.reduce(
      (range, note) => {
        const min: number = Math.min(range.minNote, note.midiNum);
        const max: number = Math.max(range.maxNote, note.midiNum);

        return { minNote: min, maxNote: max };
      },
      { minNote: 128, maxNote: -1 }
    );

    const newTrack = { ...track, notes: newNotes, minNote: newNoteRange.minNote, maxNote: newNoteRange.maxNote };

    setTracks((currTracks: TrackType[]) => {
      const newTracks: TrackType[] = currTracks.map((tr: TrackType) => (tr.id === track.id ? newTrack : tr));
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

      addNote(noteNames[noteNum], noteNum + 21, 0.25, startPosition, 0.6);
    }
  };

  useLayoutEffect(() => {
    setAutoscrollBlocked(false);
  }, [setAutoscrollBlocked]);

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
