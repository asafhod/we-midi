import * as Tone from "tone";

import e2 from "../assets/samples/guitar-distorted/guitar-dist-e2.wav";
import a2 from "../assets/samples/guitar-distorted/guitar-dist-a2.wav";
import d3 from "../assets/samples/guitar-distorted/guitar-dist-d3.wav";
import e3 from "../assets/samples/guitar-distorted/guitar-dist-e3.wav";
import g3 from "../assets/samples/guitar-distorted/guitar-dist-g3.wav";
import a3 from "../assets/samples/guitar-distorted/guitar-dist-a3.wav";
import b3 from "../assets/samples/guitar-distorted/guitar-dist-b3.wav";
import d4 from "../assets/samples/guitar-distorted/guitar-dist-d4.wav";
import e4 from "../assets/samples/guitar-distorted/guitar-dist-e4.wav";
import b4 from "../assets/samples/guitar-distorted/guitar-dist-b4.wav";
import g4 from "../assets/samples/guitar-distorted/guitar-dist-g4.wav";
import e5 from "../assets/samples/guitar-distorted/guitar-dist-e5.wav";
import a5 from "../assets/samples/guitar-distorted/guitar-dist-a5.wav";

// electric guitar (distortion)
const guitarDistorted: Partial<Tone.SamplerOptions> = {
  volume: -1,
  release: 1,
  urls: {
    e2: e2,
    a2: a2,
    d3: d3,
    e3: e3,
    g3: g3,
    a3: a3,
    b3: b3,
    d4: d4,
    e4: e4,
    b4: b4,
    g4: g4,
    e5: e5,
    a5: a5,
  },
};

export default guitarDistorted;
