import * as Tone from "tone";

export type NoteType = {
  id: number;
  name: string;
  midiNum: number;
  duration: string | number;
  noteTime: number;
  velocity: number;
};

export type RegionType = {
  startTime: number;
  endTime: number;
  notes: NoteType[];
};

export type TrackType = {
  id: number;
  name: string;
  instrumentName: string;
  instrument: Tone.Sampler;
  panVol: Tone.PanVol;
  notes: NoteType[];
  minNote: number;
  maxNote: number;
};

export type TrackData = {
  id: number;
  muted: boolean;
  solo: boolean;
  volume: number;
  pan: number;
};

export type TrackVol = {
  id: number;
  volume: number;
  muted: boolean;
};

export type SoloTrack = {
  id: number;
  solo: boolean;
};

export type SongData = {
  // id: number;
  // name: string;
  tempo: number;
  lastTrackID: number;
  trackIDs: number[];
};
