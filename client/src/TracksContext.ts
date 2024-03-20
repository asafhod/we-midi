import { createContext } from "react";
import { Message, ProjectUser, TrackType } from "./types";

type TracksContextType = {
  username: string | undefined;
  ws: WebSocket | undefined;
  childMessage: Message | undefined;
  projectUsers: ProjectUser[];
  tracks: TrackType[];
  setTracks: React.Dispatch<React.SetStateAction<TrackType[]>>;
};

const TracksContext = createContext<TracksContextType | undefined>(undefined);

export default TracksContext;
