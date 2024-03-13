import * as Tone from "tone";
import { Message, NoteType, TrackType } from "../types";
import { noteNames } from "../noteNames";

// TODO: Test all three scenarios. Fix the "no buffers available for note # bug".
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
          const newTracks: TrackType[] = currTracks.map((track: TrackType) => {
            if (track.id === trackID) {
              const newNotes: NoteType[] = track.notes.map((note: NoteType) => {
                if (note.clientNoteID === clientNoteID) {
                  return { ...note, noteID };
                }
                return note;
              });

              return { ...track, notes: newNotes };
            }
            return track;
          });

          return newTracks;
        });
      } else {
        const { trackID, noteID, midiNum, duration, noteTime, velocity } = data;

        setTracks((currTracks: TrackType[]) => {
          const newTracks: TrackType[] = currTracks.map((track: TrackType) => {
            if (track.id === trackID) {
              const noteName: string = noteNames[midiNum - 21];

              const clientNoteID: number = Tone.Transport.schedule((time: number) => {
                track.instrument.triggerAttackRelease(noteName, duration, time, velocity);
              }, noteTime);

              const newNotes: NoteType[] = [
                ...track.notes,
                { clientNoteID, noteID, name: noteName, midiNum, duration, noteTime, velocity },
              ];

              const minNote: number = Math.min(track.minNote, midiNum);
              const maxNote: number = Math.max(track.maxNote, midiNum);

              return { ...track, notes: newNotes, minNote, maxNote };
            }
            return track;
          });

          return newTracks;
        });
      }
    } else {
      const { trackID, clientNoteID } = message.data;

      setTracks((currTracks: TrackType[]) => {
        const newTracks: TrackType[] = currTracks.map((track: TrackType) => {
          if (track.id === trackID) {
            const newNoteRange: { minNote: number; maxNote: number } = { minNote: 128, maxNote: -1 };

            const newNotes: NoteType[] = track.notes.filter((note: NoteType) => {
              if (note.clientNoteID === clientNoteID) {
                Tone.Transport.clear(clientNoteID);

                return false;
              }

              newNoteRange.minNote = Math.min(newNoteRange.minNote, note.midiNum);
              newNoteRange.maxNote = Math.max(newNoteRange.maxNote, note.midiNum);
              return true;
            });

            return { ...track, notes: newNotes, minNote: newNoteRange.minNote, maxNote: newNoteRange.maxNote };
          }
          return track;
        });

        return newTracks;
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

export const deleteNote = () => {};

export const deleteNotes = () => {};
