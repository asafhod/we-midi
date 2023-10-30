import * as Tone from "tone";

// change to use dynamic imports?
import d2 from "../assets/samples/guitar-clean/guitar-clean-38.wav";
import dSharp2 from "../assets/samples/guitar-clean/guitar-clean-39.wav";
import e2 from "../assets/samples/guitar-clean/guitar-clean-40.wav";
import f2 from "../assets/samples/guitar-clean/guitar-clean-41.wav";
import fSharp2 from "../assets/samples/guitar-clean/guitar-clean-42.wav";
import g2 from "../assets/samples/guitar-clean/guitar-clean-43.wav";
import gSharp2 from "../assets/samples/guitar-clean/guitar-clean-44.wav";
import a2 from "../assets/samples/guitar-clean/guitar-clean-45.wav";
import aSharp2 from "../assets/samples/guitar-clean/guitar-clean-46.wav";
import b2 from "../assets/samples/guitar-clean/guitar-clean-47.wav";
import c3 from "../assets/samples/guitar-clean/guitar-clean-48.wav";
import cSharp3 from "../assets/samples/guitar-clean/guitar-clean-49.wav";
import d3 from "../assets/samples/guitar-clean/guitar-clean-50.wav";
import dSharp3 from "../assets/samples/guitar-clean/guitar-clean-51.wav";
import e3 from "../assets/samples/guitar-clean/guitar-clean-52.wav";
import f3 from "../assets/samples/guitar-clean/guitar-clean-53.wav";
import fSharp3 from "../assets/samples/guitar-clean/guitar-clean-54.wav";
import g3 from "../assets/samples/guitar-clean/guitar-clean-55.wav";
import gSharp3 from "../assets/samples/guitar-clean/guitar-clean-56.wav";
import a3 from "../assets/samples/guitar-clean/guitar-clean-57.wav";
import aSharp3 from "../assets/samples/guitar-clean/guitar-clean-58.wav";
import b3 from "../assets/samples/guitar-clean/guitar-clean-59.wav";
import c4 from "../assets/samples/guitar-clean/guitar-clean-60.wav";
import cSharp4 from "../assets/samples/guitar-clean/guitar-clean-61.wav";
import d4 from "../assets/samples/guitar-clean/guitar-clean-62.wav";
import dSharp4 from "../assets/samples/guitar-clean/guitar-clean-63.wav";
import e4 from "../assets/samples/guitar-clean/guitar-clean-64.wav";
import f4 from "../assets/samples/guitar-clean/guitar-clean-65.wav";
import fSharp4 from "../assets/samples/guitar-clean/guitar-clean-66.wav";
import g4 from "../assets/samples/guitar-clean/guitar-clean-67.wav";
import gSharp4 from "../assets/samples/guitar-clean/guitar-clean-68.wav";
import a4 from "../assets/samples/guitar-clean/guitar-clean-69.wav";
import aSharp4 from "../assets/samples/guitar-clean/guitar-clean-70.wav";
import b4 from "../assets/samples/guitar-clean/guitar-clean-71.wav";
import c5 from "../assets/samples/guitar-clean/guitar-clean-72.wav";
import cSharp5 from "../assets/samples/guitar-clean/guitar-clean-73.wav";
import d5 from "../assets/samples/guitar-clean/guitar-clean-74.wav";
import dSharp5 from "../assets/samples/guitar-clean/guitar-clean-75.wav";
import e5 from "../assets/samples/guitar-clean/guitar-clean-76.wav";

// electric guitar (clean)
const guitarClean: Partial<Tone.SamplerOptions> = {
  volume: 0,
  release: 1,
  urls: {
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
  },
};

export default guitarClean;
