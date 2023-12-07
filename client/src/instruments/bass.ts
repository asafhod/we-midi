import * as Tone from "tone";

import c1 from "../assets/samples/bass/bass-c1.wav";
import g1 from "../assets/samples/bass/bass-g1.wav";
import c2 from "../assets/samples/bass/bass-c2.wav";
import f2 from "../assets/samples/bass/bass-f2.wav";

// electric bass (finger)
const bass: Partial<Tone.SamplerOptions> = {
  release: 1,
  urls: {
    C1: c1,
    G1: g1,
    C2: c2,
    F2: f2,
  },
};

export default bass;
