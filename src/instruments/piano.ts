import * as Tone from "tone";

// change to use dynamic imports?
import a0 from "../assets/samples/piano/piano-01.wav";
import aSharp0 from "../assets/samples/piano/piano-02.wav";
import b0 from "../assets/samples/piano/piano-03.wav";
import c1 from "../assets/samples/piano/piano-04.wav";
import cSharp1 from "../assets/samples/piano/piano-05.wav";
import d1 from "../assets/samples/piano/piano-06.wav";
import dSharp1 from "../assets/samples/piano/piano-07.wav";
import e1 from "../assets/samples/piano/piano-08.wav";
import f1 from "../assets/samples/piano/piano-09.wav";
import fSharp1 from "../assets/samples/piano/piano-10.wav";
import g1 from "../assets/samples/piano/piano-11.wav";
import gSharp1 from "../assets/samples/piano/piano-12.wav";
import a1 from "../assets/samples/piano/piano-13.wav";
import aSharp1 from "../assets/samples/piano/piano-14.wav";
import b1 from "../assets/samples/piano/piano-15.wav";
import c2 from "../assets/samples/piano/piano-16.wav";
import cSharp2 from "../assets/samples/piano/piano-17.wav";
import d2 from "../assets/samples/piano/piano-18.wav";
import dSharp2 from "../assets/samples/piano/piano-19.wav";
import e2 from "../assets/samples/piano/piano-20.wav";
import f2 from "../assets/samples/piano/piano-21.wav";
import fSharp2 from "../assets/samples/piano/piano-22.wav";
import g2 from "../assets/samples/piano/piano-23.wav";
import gSharp2 from "../assets/samples/piano/piano-24.wav";
import a2 from "../assets/samples/piano/piano-25.wav";
import aSharp2 from "../assets/samples/piano/piano-26.wav";
import b2 from "../assets/samples/piano/piano-27.wav";
import c3 from "../assets/samples/piano/piano-28.wav";
import cSharp3 from "../assets/samples/piano/piano-29.wav";
import d3 from "../assets/samples/piano/piano-30.wav";
import dSharp3 from "../assets/samples/piano/piano-31.wav";
import e3 from "../assets/samples/piano/piano-32.wav";
import f3 from "../assets/samples/piano/piano-33.wav";
import fSharp3 from "../assets/samples/piano/piano-34.wav";
import g3 from "../assets/samples/piano/piano-35.wav";
import gSharp3 from "../assets/samples/piano/piano-36.wav";
import a3 from "../assets/samples/piano/piano-37.wav";
import aSharp3 from "../assets/samples/piano/piano-38.wav";
import b3 from "../assets/samples/piano/piano-39.wav";
import c4 from "../assets/samples/piano/piano-40.wav";
import cSharp4 from "../assets/samples/piano/piano-41.wav";
import d4 from "../assets/samples/piano/piano-42.wav";
import dSharp4 from "../assets/samples/piano/piano-43.wav";
import e4 from "../assets/samples/piano/piano-44.wav";
import f4 from "../assets/samples/piano/piano-45.wav";
import fSharp4 from "../assets/samples/piano/piano-46.wav";
import g4 from "../assets/samples/piano/piano-47.wav";
import gSharp4 from "../assets/samples/piano/piano-48.wav";
import a4 from "../assets/samples/piano/piano-49.wav";
import aSharp4 from "../assets/samples/piano/piano-50.wav";
import b4 from "../assets/samples/piano/piano-51.wav";
import c5 from "../assets/samples/piano/piano-52.wav";
import cSharp5 from "../assets/samples/piano/piano-53.wav";
import d5 from "../assets/samples/piano/piano-54.wav";
import dSharp5 from "../assets/samples/piano/piano-55.wav";
import e5 from "../assets/samples/piano/piano-56.wav";
import f5 from "../assets/samples/piano/piano-57.wav";
import fSharp5 from "../assets/samples/piano/piano-58.wav";
import g5 from "../assets/samples/piano/piano-59.wav";
import gSharp5 from "../assets/samples/piano/piano-60.wav";
import a5 from "../assets/samples/piano/piano-61.wav";
import aSharp5 from "../assets/samples/piano/piano-62.wav";
import b5 from "../assets/samples/piano/piano-63.wav";
import c6 from "../assets/samples/piano/piano-64.wav";
import a7 from "../assets/samples/piano/piano-85.wav";
import aSharp7 from "../assets/samples/piano/piano-86.wav";
import b7 from "../assets/samples/piano/piano-87.wav";
import c8 from "../assets/samples/piano/piano-88.wav";

// acoustic grand piano
const piano: Partial<Tone.SamplerOptions> = {
  volume: -3,
  release: 1,
  urls: {
    A0: a0,
    "A#0": aSharp0,
    B0: b0,
    C1: c1,
    "C#1": cSharp1,
    D1: d1,
    "D#1": dSharp1,
    E1: e1,
    F1: f1,
    "F#1": fSharp1,
    G1: g1,
    "G#1": gSharp1,
    A1: a1,
    "A#1": aSharp1,
    B1: b1,
    C2: c2,
    "C#2": cSharp2,
    D2: d2,
    "D#2": dSharp2,
    E2: e2,
    F2: f2,
    "F#2": fSharp2,
    G2: g2,
    "G#2": gSharp2,
    A2: a2,
    "A#2": aSharp2,
    B2: b2,
    C3: c3,
    "C#3": cSharp3,
    D3: d3,
    "D#3": dSharp3,
    E3: e3,
    F3: f3,
    "F#3": fSharp3,
    G3: g3,
    "G#3": gSharp3,
    A3: a3,
    "A#3": aSharp3,
    B3: b3,
    C4: c4,
    "C#4": cSharp4,
    D4: d4,
    "D#4": dSharp4,
    E4: e4,
    F4: f4,
    "F#4": fSharp4,
    G4: g4,
    "G#4": gSharp4,
    A4: a4,
    "A#4": aSharp4,
    B4: b4,
    C5: c5,
    "C#5": cSharp5,
    D5: d5,
    "D#5": dSharp5,
    E5: e5,
    F5: f5,
    "F#5": fSharp5,
    G5: g5,
    "G#5": gSharp5,
    A5: a5,
    "A#5": aSharp5,
    B5: b5,
    C6: c6,
    A7: a7,
    "A#7": aSharp7,
    B7: b7,
    C8: c8,
  },
};

export default piano;
