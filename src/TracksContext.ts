import { createContext } from "react";
import { TrackType } from "./types";

type TracksContextType = {
  tracks: TrackType[];
  setTracks: React.Dispatch<React.SetStateAction<TrackType[]>>;
};

const TracksContext = createContext<TracksContextType | undefined>(undefined);

export default TracksContext;
