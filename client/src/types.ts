import * as Tone from "tone";

export type NoteType = {
  clientNoteID: number;
  noteID: number;
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

export type TrackControlType = {
  id: number;
  volume: number;
  muted: boolean;
  solo: boolean;
  pan: number;
};

export type SongData = {
  name: string;
  tempo: number;
  trackIDs: number[];
};

export type ProjectUser = {
  username: string;
  isProjectAdmin: boolean;
  isAccepted: boolean;
  isOnline?: boolean;
  isNotMember?: boolean;
};

export type Message = {
  action: string;
  source?: string;
  success: boolean;
  data: any;
  msg?: string;
};
