import * as Tone from "tone";
import { Message, NoteType, TrackType } from "../types";
import { noteNames } from "../noteNames";

export const insertNote = (
  track: TrackType,
  noteID: number,
  midiNum: number,
  duration: string | number,
  noteTime: number,
  velocity: number,
  clientNoteID?: number
): { newTrack: TrackType; newClientNoteID: number } => {
  const noteName: string = noteNames[midiNum - 21];

  if (clientNoteID === undefined || clientNoteID === -1) {
    clientNoteID = Tone.Transport.schedule((time: number) => {
      track.instrument.triggerAttackRelease(noteName, duration, time, velocity);
    }, noteTime);
  }

  const newNotes: NoteType[] = [...track.notes, { clientNoteID, noteID, name: noteName, midiNum, duration, noteTime, velocity }];

  const minNote: number = Math.min(track.minNote, midiNum);
  const maxNote: number = Math.max(track.maxNote, midiNum);

  return { newTrack: { ...track, notes: newNotes, minNote, maxNote }, newClientNoteID: clientNoteID };
};

export const addNote = (
  ws: WebSocket,
  message: Message,
  username: string | undefined,
  setTracks: React.Dispatch<React.SetStateAction<TrackType[]>>
) => {
  try {
    if (message.success) {
      const { source, data } = message;

      if (source === username) {
        const { trackID, clientNoteID, noteID } = data;

        setTracks((currTracks: TrackType[]) => {
          return currTracks.map((track: TrackType) => {
            if (track.id === trackID) {
              const newNotes: NoteType[] = track.notes.map((note: NoteType) =>
                note.clientNoteID === clientNoteID ? { ...note, noteID } : note
              );

              return { ...track, notes: newNotes };
            }
            return track;
          });
        });
      } else {
        const { trackID, noteID, midiNum, duration, noteTime, velocity } = data;
        let clientNoteID: number = -1;

        setTracks((currTracks: TrackType[]) => {
          return currTracks.map((track: TrackType) => {
            if (track.id === trackID) {
              const { newTrack, newClientNoteID } = insertNote(track, noteID, midiNum, duration, noteTime, velocity, clientNoteID);
              clientNoteID = newClientNoteID;

              return newTrack;
            }
            return track;
          });
        });
      }
    } else {
      const { trackID, clientNoteID } = message.data;

      setTracks((currTracks: TrackType[]) => {
        return currTracks.map((track: TrackType) => {
          if (track.id === trackID) {
            const newTrack: TrackType = removeNote(track, "clientNoteID", clientNoteID);
            return newTrack;
          }
          return track;
        });
      });

      console.error(`Server could not add note: ${message.msg}\nOperation rolled back`);
    }
  } catch (error) {
    console.error(`Error adding note: ${error}`);

    // close the connection with Close Code 4400 for generic client-side error
    ws.close(4400);
  }
};

export const addNotes = () => {};

export const updateNote = () => {};

export const updateNotes = () => {};

export const removeNote = (track: TrackType, noteIDType: "noteID" | "clientNoteID", id: number): TrackType => {
  const newNoteRange: { minNote: number; maxNote: number } = { minNote: 128, maxNote: -1 };

  const newNotes: NoteType[] = track.notes.filter((note: NoteType) => {
    if (note[noteIDType] === id) {
      Tone.Transport.clear(note.clientNoteID);

      return false;
    }

    newNoteRange.minNote = Math.min(newNoteRange.minNote, note.midiNum);
    newNoteRange.maxNote = Math.max(newNoteRange.maxNote, note.midiNum);

    return true;
  });

  return { ...track, notes: newNotes, minNote: newNoteRange.minNote, maxNote: newNoteRange.maxNote };
};

export const deleteNote = (ws: WebSocket, message: Message, setTracks: React.Dispatch<React.SetStateAction<TrackType[]>>) => {
  try {
    const { trackID, noteID } = message.data;

    setTracks((currTracks: TrackType[]) => {
      return currTracks.map((track: TrackType) => {
        if (track.id === trackID) {
          const newTrack: TrackType = removeNote(track, "noteID", noteID);
          return newTrack;
        }
        return track;
      });
    });
  } catch (error) {
    console.error(`Error deleting note: ${error}`);

    // close the connection with Close Code 4400 for generic client-side error
    ws.close(4400);
  }
};

export const deleteNotes = () => {};
