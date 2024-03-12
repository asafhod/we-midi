import { createContext } from "react";
import { TrackType } from "./types";

type TracksContextType = {
  ws: WebSocket | undefined;
  tracks: TrackType[];
  setTracks: React.Dispatch<React.SetStateAction<TrackType[]>>;
};

const TracksContext = createContext<TracksContextType | undefined>(undefined);

export default TracksContext;
