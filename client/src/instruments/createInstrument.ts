import * as Tone from "tone";
import drums from "./drums";
import bass from "./bass";
import guitarClean from "./guitarClean";
import guitarDistorted from "./guitarDistorted";
import piano from "./piano";

const createInstrument = (instrumentCode: string): Tone.Sampler => {
  // TODO: Use this code when importing MIDI - Differentiate distorted guitar from clean guitar
  // if (instrumentNum === 30 || instrumentNum === 31) {
  //   instrumentName = "e";
  // }

  // TODO: implement 8-bit and synth

  // set up instrument dictionary
  const instruments: Record<string, Partial<Tone.SamplerOptions>> = {
    p: piano,
    g: guitarClean,
    e: guitarDistorted,
    b: bass,
    d: drums,
  };

  // use code to get instrument
  let instrument: Partial<Tone.SamplerOptions> | undefined = instruments[instrumentCode];

  // if instrument code is unaccounted for, default to acoustic grand piano
  if (!instrument) instrument = piano;

  return new Tone.Sampler(instrument);
};

export default createInstrument;
