import { useEffect } from "react";
import { Message, SongData, TrackType, TrackControlType } from "./types";
import { fetchAuthSession } from "aws-amplify/auth";
import { loadProject } from "./message-handlers/projects";

const useMessageRouter = (
  projectID: string,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setSongData: React.Dispatch<React.SetStateAction<SongData>>,
  setTracks: React.Dispatch<React.SetStateAction<TrackType[]>>,
  setTrackControls: React.Dispatch<React.SetStateAction<TrackControlType[]>>,
  setTempo: React.Dispatch<React.SetStateAction<string>>,
  setMidiFile: React.Dispatch<React.SetStateAction<File | null>>
) => {
  // TODO: Update to real server URL when deploying
  const baseWsServerURL: string = "ws://localhost:5000?projectID=";

  useEffect(() => {
    const handleMessage = (message: Message) => {
      switch (message.action) {
        case "getProject":
          loadProject(message, setLoading, setSongData, setTracks, setTrackControls, setTempo, setMidiFile);
          break;
        case "updateProject":
          console.log(message);
          break;
        case "deleteProject":
          console.log(message);
          break;
        case "importMIDI":
          console.log(message);
          break;
        case "addTrack":
          console.log(message);
          break;
        case "updateTrack":
          console.log(message);
          break;
        case "deleteTrack":
          console.log(message);
          break;
        case "addNote":
          console.log(message);
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
          console.log(message);
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
          console.error(`Invalid message action: ${message.action}`);
          console.error(message);
      }
    };

    const setupWebSocket = async () => {
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

          handleMessage(message);
        } catch (error) {
          console.error(`WebSocket message JSON parse error: ${error}`);
        }
      };

      // set up CLOSE event handler
      newSocket.onclose = () => {
        console.log("Connection closed");
      };

      // set up ERROR event handler
      newSocket.onerror = (error) => {
        console.error(`WebSocket error: ${error}`);
      };
    };

    try {
      setupWebSocket();
    } catch (error) {
      console.error(`Could not set up WebSocket connection - Error: ${error}`);
    }
  }, [projectID, setLoading, setSongData, setTracks, setTrackControls, setTempo, setMidiFile]);
};

export default useMessageRouter;
