import * as Tone from "tone";
import drums from "./drums";
import bass from "./bass";
import guitarClean from "./guitarClean";
import guitarDistorted from "./guitarDistorted";
import piano from "./piano";

const createInstrument = (instrumentNum: number, instrumentFamily: string): Tone.Sampler => {
  // 26 is electric guitar (jazz) - possibly get rid of this later, or use ranges/families to cover other instrument numbers
  // 86 is synth - lead 6 (voice) - can implement with samples later
  const instruments: { [key: string]: Partial<Tone.SamplerOptions> } = {
    "0": piano,
    "26": guitarClean,
    "28": guitarClean,
    "31": guitarDistorted,
    "33": bass,
  };

  if (instrumentFamily === "drums") {
    return new Tone.Sampler(drums).toDestination();
  } else {
    let instrument: Partial<Tone.SamplerOptions> | undefined = instruments[String(instrumentNum)];

    // if instrument number is not accounted for, defaulting to acoustic grand piano
    if (!instrument) instrument = instruments["0"];

    return new Tone.Sampler(instrument).toDestination();
  }
};

export default createInstrument;
