import { Message, SongData, TrackType, TrackControlType } from "../types";

export const loadProject = (
  message: Message,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setSongData: React.Dispatch<React.SetStateAction<SongData>>,
  setTracks: React.Dispatch<React.SetStateAction<TrackType[]>>,
  setTrackControls: React.Dispatch<React.SetStateAction<TrackControlType[]>>,
  setTempo: React.Dispatch<React.SetStateAction<string>>,
  setMidiFile: React.Dispatch<React.SetStateAction<File | null>>
) => {
  // TODO: Implement
};

export const updateProject = () => {};

export const importMIDI = () => {};

export const addTrack = () => {};

export const updateTrack = () => {};

export const deleteTrack = () => {};
