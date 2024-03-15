import { useLayoutEffect } from "react";
import { useContext } from "react";
import TracksContext from "./TracksContext";
import { TrackType } from "./types";
import { insertNote, removeNote } from "./controllers/notes";

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
        <EditorNote key={note.clientNoteID} noteID={note.noteID} left={noteLeft} top={noteTop} width={noteWidth} height={noteHeight} />
      );
    }
  }

  const addNote = (midiNum: number, duration: string | number, noteTime: number, velocity: number) => {
    if (ws) {
      const { newTrack, newClientNoteID } = insertNote(track, 0, midiNum, duration, noteTime, velocity);

      setTracks((currTracks: TrackType[]) => {
        return currTracks.map((tr: TrackType) => (tr.id === track.id ? newTrack : tr));
      });

      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              action: "addNote",
              data: { trackID: track.id, clientNoteID: newClientNoteID, midiNum, duration, noteTime, velocity },
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

  const deleteNote = (noteID: number) => {
    if (ws && noteID) {
      const newTrack: TrackType = removeNote(track, "noteID", noteID);

      setTracks((currTracks: TrackType[]) => {
        return currTracks.map((tr: TrackType) => (tr.id === track.id ? newTrack : tr));
      });

      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ action: "deleteNote", data: { trackID: track.id, noteID } }));
        } else {
          throw new Error("WebSocket is not open");
        }
      } catch (error) {
        console.error(`Error deleting note: ${error}`);

        // close the connection with Close Code 4400 for generic client-side error
        ws.close(4400);
      }
    }
  };

  const addDeleteNote = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const target = e.target as HTMLDivElement;

    if (target.classList.contains("editor-note")) {
      deleteNote(Number(target.dataset.noteid));
    } else {
      const clickY: number = Math.round(target.getBoundingClientRect().bottom) - e.clientY;
      const midiNum: number = Math.floor(clickY / 24) + 21;

      addNote(midiNum, 0.25, startPosition, 64);
    }
  };

  useLayoutEffect(() => {
    setAutoscrollBlocked(false);
  }, [setAutoscrollBlocked]);

  return (
    <div className="midi-editor" onDoubleClick={(e) => addDeleteNote(e)}>
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
  return <div className="editor-note" data-noteid={String(noteID)} style={{ left, top, width, height }} />;
};

export default MidiEditor;
