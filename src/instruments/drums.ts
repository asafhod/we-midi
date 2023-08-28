import * as Tone from "tone";

import crashRight from "../assets/samples/drums/crashRight.wav";
import crashLeft from "../assets/samples/drums/crashLeft.wav";
import splash from "../assets/samples/drums/splash.wav";
import rideBell from "../assets/samples/drums/rideBell.wav";
import chineseCymbal from "../assets/samples/drums/chineseCymbal.wav";
import rideCymbal from "../assets/samples/drums/rideCymbal.wav";
import tomHigh from "../assets/samples/drums/tomHigh.wav";
import tomMid from "../assets/samples/drums/tomMid.wav";
import tomLow from "../assets/samples/drums/tomLow.wav";
import hiHatOpen from "../assets/samples/drums/hiHatOpen.wav";
import hiHatHalf from "../assets/samples/drums/hiHatHalf.wav";
import hiHatClosed from "../assets/samples/drums/hiHatClosed.wav";
import snare from "../assets/samples/drums/snare.wav";
import handClap from "../assets/samples/drums/handClap.wav";
import sideStick from "../assets/samples/drums/sideStick.wav";
import kick from "../assets/samples/drums/kick.wav";

// drums - standard kit
const drums: Partial<Tone.SamplerOptions> = {
  volume: 8,
  release: 1,
  urls: {
    // Likely control notes of some kind. Haven't done these as of now. Implement?
    //    83: c1, // CHOKE ALL CYMBALS
    //    65: c1, // HI-HAT PEDAL - Plays sample similar to HI-HAT CLOSED, then chokes any HI-HAT samples currently playing
    //    58: c1, // CRASH RIGHT CHOKED - Plays CRASH RIGHT sample, then chokes it

    // CYMBALS
    57: crashRight, // CRASH RIGHT
    49: crashLeft, // CRASH LEFT
    55: splash, // SPLASH
    53: rideBell, // RIDE BELL
    52: chineseCymbal, // CHINESE CYMBAL
    51: rideCymbal, // RIDE CYMBAL

    // TOMS
    50: tomHigh, // TOM HIGH - High Tom
    48: tomHigh, // TOM HIGH - High-Mid Tom
    47: tomMid, // TOM MID - Low-Mid Tom
    45: tomMid, // TOM MID - Low Tom
    43: tomLow, // TOM LOW - High Floor Tom
    41: tomLow, // TOM LOW - Low Floor Tom

    // HI-HAT
    46: hiHatOpen, // HI-HAT OPEN
    44: hiHatHalf, // HI-HAT HALF OPEN
    42: hiHatClosed, // HI-HAT CLOSED

    // SNARES
    40: snare, // SNARE - Electric Snare
    38: snare, // SNARE - Acoustic Snare
    39: handClap, // HAND CLAP
    37: sideStick, // SIDE STICK

    // KICKS
    36: kick, // KICK - Electric Bass Drum
    35: kick, // KICK - Acoustic Bass Drum
  },
};

export default drums;
