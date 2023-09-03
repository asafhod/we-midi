import { useState, useEffect } from "react";
import { Midi as MidiLoad, MidiJSON, TrackJSON } from "@tonejs/midi";
import * as Tone from "tone";
import { NoteType, TrackType } from "./types";
import createInstrument from "./instruments/createInstrument";
import TracksContext from "./TracksContext";
import Player from "./Player";
import TrackEditor from "./TrackEditor";

type WorkspaceProps = {
  midiURL: string;
};

const Workspace = ({ midiURL }: WorkspaceProps): JSX.Element => {
  const [loading, setLoading] = useState(true);
  const [tracks, setTracks] = useState<TrackType[]>([]);

  useEffect(() => {
    // clear it in a cleanup function for unmount and in case url changes
    const loadMidi = async (midiURL: string) => {
      const midi: MidiJSON = await MidiLoad.fromUrl(midiURL);
      if (!midi || !Object.keys(midi).length) throw new Error("Cannot schedule notes: Invalid MIDI file");

      console.log(midi);

      await Tone.start();

      Tone.Transport.PPQ = midi.header.ppq;
      Tone.Transport.bpm.value = midi.header.tempos[0].bpm;

      const tracks: TrackType[] = [];

      for (let i = 1; i < midi.tracks.length; i++) {
        const track: TrackJSON = midi.tracks[i];
        const instrument: Tone.Sampler = createInstrument(track.instrument.number, track.instrument.family);

        await Tone.loaded();

        const notes: NoteType[] = [];

        for (const { midi, duration, time: noteTime, velocity } of track.notes) {
          const noteID: number = Tone.Transport.schedule((time) => {
            instrument.triggerAttackRelease(midi, duration, time, velocity);
          }, noteTime);

          notes.push({ noteID, midi, duration, noteTime, velocity });
        }

        tracks.push({ name: track.name, instrument, notes });
      }

      setTracks(tracks);
      setLoading(false);
    };

    try {
      loadMidi(midiURL);
    } catch (error) {
      console.error(error);
    }
  }, [midiURL]);

  return (
    <div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="workspace">
          <Player />

          <TracksContext.Provider value={{ tracks, setTracks }}>
            <TrackEditor numTracks={tracks.length} />
          </TracksContext.Provider>
        </div>
      )}
    </div>
  );
};

export default Workspace;
