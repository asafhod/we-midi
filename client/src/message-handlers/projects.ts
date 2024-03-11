import * as Tone from "tone";
import { Message, SongData, TrackType, NoteType, TrackControlType } from "../types";
import { noteNames } from "../noteNames";
import createInstrument from "../instruments/createInstrument";

export const loadProject = async (
  message: Message,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setSongData: React.Dispatch<React.SetStateAction<SongData>>,
  setTracks: React.Dispatch<React.SetStateAction<TrackType[]>>,
  setTrackControls: React.Dispatch<React.SetStateAction<TrackControlType[]>>,
  setTempo: React.Dispatch<React.SetStateAction<string>>
) => {
  if (message.success) {
    const { data } = message;

    await Tone.start();

    Tone.Transport.PPQ = data.project.ppq;
    Tone.Transport.bpm.value = data.project.tempo;

    const tracks: TrackType[] = [];
    const trackControls: TrackControlType[] = [];
    const trackIDs: number[] = [];

    for (const track of data.project.tracks) {
      const { trackID, trackName, volume, pan, solo, mute } = track;
      const trackControl: TrackControlType = { id: trackID, volume, muted: mute, solo, pan };
      const instrument: Tone.Sampler = createInstrument(track.instrument);

      const panVol: Tone.PanVol = new Tone.PanVol(trackControl.pan, trackControl.volume);
      instrument.chain(panVol, Tone.Destination);

      await Tone.loaded();

      const notes: NoteType[] = [];
      let minNote: number = 128;
      let maxNote: number = -1;

      for (const { noteID, midiNum, duration, noteTime, velocity } of track.notes) {
        const noteName: string = noteNames[midiNum - 21];
        const id: number = Tone.Transport.schedule((time) => {
          instrument.triggerAttackRelease(noteName, duration, time, velocity);
        }, noteTime);

        notes.push({ id, noteID, name: noteName, midiNum, duration, noteTime, velocity });

        minNote = Math.min(minNote, midiNum);
        maxNote = Math.max(maxNote, midiNum);
      }
      trackIDs.push(trackID);
      trackControls.push(trackControl);
      tracks.push({ id: trackID, name: trackName, instrumentName: track.instrument, instrument, panVol, notes, minNote, maxNote });
    }

    setTrackControls(trackControls);
    setTracks((currTracks) => {
      for (const track of currTracks) {
        for (const note of track.notes) {
          Tone.Transport.clear(note.id);
        }

        track.panVol.dispose();
        track.instrument.dispose();
      }

      return tracks;
    });
    setTempo(String(Tone.Transport.bpm.value));
    setSongData({ name: data.project.name, tempo: Tone.Transport.bpm.value, trackIDs });
    setLoading(false);
  } else {
    // TODO: Disconnect and display message
  }
};

export const updateProject = () => {};

export const importMIDI = () => {};

export const addTrack = () => {};

export const updateTrack = () => {};

export const deleteTrack = () => {};
