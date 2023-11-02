import * as Tone from "tone";

export type NoteType = {
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
  name: string;
  instrumentName: string;
  instrument: Tone.Sampler;
  notes: NoteType[];
  minNote: number;
  maxNote: number;
};
