import { useState, useEffect, useLayoutEffect, useRef, useContext, useMemo } from "react";
import TracksContext from "./TracksContext";
import { TrackType, ProjectUser } from "./types";
import { insertNote, removeNote } from "./controllers/notes";
import { ReactComponent as CursorIcon } from "./assets/icons/cursor.svg";

type MouseDataItem = { top: number; time: number; leftClick: Boolean; rightClick: Boolean };
type MouseData = Record<string, MouseDataItem>;

type EditingUsers = { users: ProjectUser[]; usernames: string[]; displayNames: JSX.Element[] };

type MidiEditorProps = {
  track: TrackType;
  setTracks: React.Dispatch<React.SetStateAction<TrackType[]>>;
  widthFactor: number;
  startPosition: number;
  setAutoscrollBlocked: React.Dispatch<React.SetStateAction<boolean>>;
};

const MidiEditor = ({ track, setTracks, widthFactor, startPosition, setAutoscrollBlocked }: MidiEditorProps): JSX.Element => {
  const { ws, childMessage, username, projectUsers } = useContext(TracksContext)!;
  const readyRef = useRef(false);
  const leftClickRef = useRef(false);
  const rightClickRef = useRef(false);
  const lastMouseSendRef = useRef(0);
  const [mouseData, setMouseData] = useState<MouseData>({});

  const { id } = track;

  const editingUsers: EditingUsers = useMemo(() => {
    return projectUsers.reduce(
      (editingUsers: EditingUsers, pu: ProjectUser) => {
        if (pu.currentView === id) {
          if (pu.username !== username) {
            editingUsers.users.push(pu);
            editingUsers.usernames.push(pu.username);
          }

          editingUsers.displayNames.push(
            <li key={pu.username} style={{ color: pu.color }}>
              {pu.username}
            </li>
          );
        }

        return editingUsers;
      },
      { users: [], usernames: [], displayNames: [] }
    );
  }, [projectUsers, id, username]);

  // TODO: Merge/split editingUsers?
  const mice: (JSX.Element | null)[] = useMemo(() => {
    return editingUsers.users.map((pu: ProjectUser) => {
      const userMouseData: MouseDataItem = mouseData[pu.username];

      if (userMouseData) {
        const { top, leftClick, rightClick } = userMouseData;
        const left: number = Math.round(userMouseData.time * widthFactor) + 1;

        return <MouseCursor key={pu.username} top={top} left={left} leftClick={leftClick} rightClick={rightClick} color={pu.color} />;
      }
      return null;
    });
  }, [editingUsers, mouseData, widthFactor]);

  console.log(editingUsers.usernames);

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
        return currTracks.map((tr: TrackType) => (tr.id === id ? newTrack : tr));
      });

      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              action: "addNote",
              data: { trackID: id, clientNoteID: newClientNoteID, midiNum, duration, noteTime, velocity },
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
        return currTracks.map((tr: TrackType) => (tr.id === id ? newTrack : tr));
      });

      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ action: "deleteNote", data: { trackID: id, noteID } }));
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

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (e.button === 0) {
      leftClickRef.current = true;
    } else if (e.button === 2) {
      rightClickRef.current = true;
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (e.button === 0) {
      leftClickRef.current = false;
    } else if (e.button === 2) {
      rightClickRef.current = false;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (editingUsers.usernames.length && ws) {
      try {
        if (ws.readyState === WebSocket.OPEN) {
          const currentTime: number = Date.now();
          // TODO: Logic to send mouse data after scrolling page with left/right wheel or after zooming (calculation is mathy because can't use mouseMove, especially so for zoom - low priority)

          // only send userMouse message if at least 77 ms have passed since the last one was sent (throttles to about 13 message per second)
          if (currentTime - lastMouseSendRef.current >= 77) {
            const target = e.currentTarget as HTMLDivElement;

            const x: number = Math.max(e.clientX - Math.round(target.getBoundingClientRect().left), 0);
            const y: number = Math.max(e.clientY - Math.round(target.getBoundingClientRect().top) + 1, 0);

            const time: number = x / widthFactor;

            ws.send(
              JSON.stringify({
                action: "userMouse",
                data: {
                  top: y,
                  time,
                  leftClick: leftClickRef.current,
                  rightClick: rightClickRef.current,
                  targetUsers: editingUsers.usernames,
                },
              })
            );

            lastMouseSendRef.current = currentTime;
          }
        } else {
          // TODO: Don't have close logic since already closed? If so, same for similar code elsewhere.
          throw new Error("WebSocket is not open");
        }
      } catch (error) {
        console.error(`Error sending mouse data: ${error}`);

        // close the connection with Close Code 4400 for generic client-side error
        ws.close(4400);
      }
    }
  };

  // TODO: Test if this plays nice with Strict Mode and the ready flag
  useEffect(() => {
    if (readyRef.current) {
      if (childMessage && childMessage.action === "userMouse") {
        setMouseData((currMouseData: MouseData) => {
          const { source, data } = childMessage;
          return source ? { ...currMouseData, [source]: data } : currMouseData;
        });
      }
    }
  }, [childMessage]);

  // TODO: Logic to update the mouseData times if the tempo changes (after you switch to measure-based, this part will no longer be necessary)
  // useEffect(() => {
  //   if (readyRef.current) {
  //       setMouseData((currMouseData: MouseData) => {
  //         return currMouseData;
  //       });
  //   }
  // }, [TEMPO-DEP]);

  // TODO: Test if this plays nice with Strict Mode and the ready flag
  useEffect(() => {
    readyRef.current = true;
  }, []);

  useLayoutEffect(() => {
    setAutoscrollBlocked(false);
  }, [setAutoscrollBlocked]);

  return (
    <div
      className="midi-editor"
      onDoubleClick={(e) => addDeleteNote(e)}
      onMouseDown={(e) => handleMouseDown(e)}
      onMouseUp={(e) => handleMouseUp(e)}
      onMouseMove={(e) => handleMouseMove(e)}
    >
      {notes}
      <ul style={{ width: "110px" }}>{editingUsers.displayNames}</ul>
      {mice}
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

type MouseCursorProps = {
  top: number;
  left: number;
  leftClick: Boolean;
  rightClick: Boolean;
  color: string;
};

const MouseCursor = ({ top, left, leftClick, rightClick, color }: MouseCursorProps): JSX.Element => {
  const fill: string = leftClick && rightClick ? "purple" : leftClick ? "green" : rightClick ? "red" : color;

  return <CursorIcon className="mouse-cursor" aria-label="User Cursor" fill={fill} style={{ top, left }} />;
};

export default MidiEditor;
