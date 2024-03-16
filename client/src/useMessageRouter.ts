import { useEffect, useRef } from "react";
import * as Tone from "tone";
import { Message, SongData, TrackType, TrackControlType, ProjectUser } from "./types";
import { fetchAuthSession } from "aws-amplify/auth";
import { loadProject, addTrack, deleteTrack } from "./controllers/projects";
import { addNote, deleteNote } from "./controllers/notes";
import { userConnected, userDisconnected } from "./controllers/projectUsers";

const useMessageRouter = (
  projectID: string | undefined,
  username: string | undefined,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setDisconnected: React.Dispatch<React.SetStateAction<boolean>>,
  setWs: React.Dispatch<React.SetStateAction<WebSocket | undefined>>,
  setSongData: React.Dispatch<React.SetStateAction<SongData>>,
  setTracks: React.Dispatch<React.SetStateAction<TrackType[]>>,
  setTrackControls: React.Dispatch<React.SetStateAction<TrackControlType[]>>,
  setTempo: React.Dispatch<React.SetStateAction<string>>,
  setProjectUsers: React.Dispatch<React.SetStateAction<ProjectUser[]>>,
  setMidiFile: React.Dispatch<React.SetStateAction<File | null>>
) => {
  // TODO: Update to real server URL when deploying
  const baseWsServerURL: string = "ws://localhost:5000?projectID=";

  const readyRef = useRef(false);

  useEffect(() => {
    if (!readyRef.current) {
      readyRef.current = true;

      const handleMessage = (message: Message, ws: WebSocket) => {
        switch (message.action) {
          case "getProject":
            loadProject(ws, message, setLoading, setSongData, setTracks, setTrackControls, setTempo, setProjectUsers);
            break;
          case "updateProject":
            console.log(message);
            break;
          case "deleteProject":
            // TODO: Implement this as a button somewhere that deletes the project
            //       Then delete this case. No message handler is necessary since it just disconnects all users. This is just here as a reminder.
            console.log(message);
            break;
          case "importMIDI":
            console.log(message);
            break;
          case "addTrack":
            addTrack(ws, message, setTracks, setTrackControls);
            break;
          case "updateTrack":
            console.log(message);
            break;
          case "deleteTrack":
            deleteTrack(ws, message, setTracks, setTrackControls);
            break;
          case "addNote":
            addNote(ws, message, username, setTracks);
            break;
          case "addNotes":
            console.log(message);
            break;
          case "updateNote":
            console.log(message);
            break;
          case "updateNotes":
            console.log(message);
            break;
          case "deleteNote":
            deleteNote(ws, message, setTracks);
            break;
          case "deleteNotes":
            console.log(message);
            break;
          case "searchUsers":
            console.log(message);
            break;
          case "addProjectUsers":
            console.log(message);
            break;
          case "acceptProjectUser":
            console.log(message);
            break;
          case "updateProjectUsers":
            console.log(message);
            break;
          case "deleteProjectUsers":
            console.log(message);
            break;
          case "deleteProjectUser":
            console.log(message);
            break;
          case "userConnected":
            userConnected(ws, message, setProjectUsers);
            break;
          case "userDisconnected":
            userDisconnected(ws, message, setProjectUsers);
            break;
          case "userCurrentView":
            console.log(message);
            break;
          case "userMouse":
            console.log(message);
            break;
          case "chatMessage":
            console.log(message);
            break;
          default:
            console.error(`Invalid message action: ${message.action}\n${message}`);
        }
      };

      const setupWebSocket = async () => {
        try {
          if (projectID) {
            // get Cognito access token
            const { accessToken } = (await fetchAuthSession()).tokens ?? {};
            if (!accessToken) throw new Error("Invalid Cognito access token");

            // create the WebSocket
            const newSocket = new WebSocket(`${baseWsServerURL}${projectID}`, ["json", accessToken.toString()]);

            // set up OPEN event handler
            newSocket.onopen = () => {
              console.log("Connection established");
            };

            // set up message router
            newSocket.onmessage = (event: MessageEvent<any>) => {
              try {
                console.log("Message received");
                const message: any = JSON.parse(event.data);

                handleMessage(message, newSocket);
              } catch (error) {
                console.error(`WebSocket message JSON parse error: ${error}`);
              }
            };

            // set up CLOSE event handler
            newSocket.onclose = () => {
              console.log("Connection closed");

              setDisconnected(true);
            };

            // set up ERROR event handler
            newSocket.onerror = (error) => {
              // TODO: Possibly remove method-specific error handling (or this one?) if redundant
              console.error(`WebSocket error: ${error}`);
            };

            setWs(newSocket);
          } else {
            setLoading(false);
          }
        } catch (error) {
          console.error(`Could not set up WebSocket connection - Error: ${error}`);
          setDisconnected(true);
        }
      };

      setupWebSocket();
    }

    return () => {
      Tone.Transport.stop();
      Tone.Transport.cancel();

      setTracks((currTracks: TrackType[]) => {
        for (const track of currTracks) {
          track.panVol.dispose();
          track.instrument.dispose();
        }

        return [];
      });
    };
  }, [
    projectID,
    username,
    setLoading,
    setDisconnected,
    setWs,
    setSongData,
    setTracks,
    setTrackControls,
    setTempo,
    setProjectUsers,
    setMidiFile,
  ]);
};

export default useMessageRouter;
