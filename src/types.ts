import * as Tone from "tone";

export type NoteType = {
  noteID: number;
  name: string;
  duration: string | number;
  noteTime: number;
  velocity: number;
};

export type TrackType = {
  name: string;
  instrument: Tone.Sampler;
  notes: NoteType[];
};
