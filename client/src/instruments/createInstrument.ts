import * as Tone from "tone";
import drums from "./drums";
import bass from "./bass";
import guitarClean from "./guitarClean";
import guitarDistorted from "./guitarDistorted";
import piano from "./piano";

const createInstrument = (instrumentType: string, instrumentNum?: number): { instrument: Tone.Sampler; instrumentName: string } => {
  // TODO: implement 8-bit and synth
  const instruments: { [key: string]: Partial<Tone.SamplerOptions> } = {
    piano: piano,
    guitar: guitarClean,
    guitarDist: guitarDistorted,
    bass: bass,
    drums: drums,
  };

  let instrumentName: string = instrumentType;

  // differentiate distorted guitar from clean guitar
  if (instrumentNum === 30 || instrumentNum === 31) {
    instrumentName = "guitarDist";
  }

  let instrument: Partial<Tone.SamplerOptions> | undefined = instruments[instrumentName];

  // if instrument name is not accounted for, default to acoustic grand piano
  if (!instrument) {
    instrumentName = "piano";
    instrument = piano;
  }

  const instrumentSampler: Tone.Sampler = new Tone.Sampler(instrument);
  return { instrument: instrumentSampler, instrumentName };
};

export default createInstrument;
