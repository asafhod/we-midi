import * as Tone from "tone";

export type NoteType = {
  noteID: number;
  midi: number;
  duration: string | number;
  noteTime: number;
  velocity: number;
};

export type TrackType = {
  name: string;
  instrument: Tone.Sampler;
  notes: NoteType[];
};
