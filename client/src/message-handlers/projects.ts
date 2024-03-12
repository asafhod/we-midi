import * as Tone from "tone";
import { Message, SongData, TrackType, NoteType, TrackControlType, ProjectUser } from "../types";
import { noteNames } from "../noteNames";
import createInstrument from "../instruments/createInstrument";

export const loadProject = async (
  ws: WebSocket,
  message: Message,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setSongData: React.Dispatch<React.SetStateAction<SongData>>,
  setTracks: React.Dispatch<React.SetStateAction<TrackType[]>>,
  setTrackControls: React.Dispatch<React.SetStateAction<TrackControlType[]>>,
  setTempo: React.Dispatch<React.SetStateAction<string>>,
  setProjectUsers: React.Dispatch<React.SetStateAction<ProjectUser[]>>,
  setConnectedUsers: React.Dispatch<React.SetStateAction<string[]>>
) => {
  try {
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
      setTracks((currTracks: TrackType[]) => {
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
      setProjectUsers(data.projectUsers);
      setConnectedUsers(data.connectedUsers);
      setLoading(false);
    } else {
      throw new Error("GetProject operation failed");
    }
  } catch (error) {
    console.error(`Error loading project: ${error}`);

    // close the connection with Close Code 4400 for generic client-side error
    ws.close(4400);
  }
};

export const updateProject = () => {};

export const importMIDI = () => {};

export const addTrack = async (
  ws: WebSocket,
  message: Message,
  setTracks: React.Dispatch<React.SetStateAction<TrackType[]>>,
  setTrackControls: React.Dispatch<React.SetStateAction<TrackControlType[]>>
) => {
  try {
    if (message.success) {
      const DEFAULT_VOLUME: number = -16;

      const { source, data } = message;

      const trackControl: TrackControlType = { id: data.trackID, volume: DEFAULT_VOLUME, muted: false, solo: false, pan: 0 };
      const instrument: Tone.Sampler = createInstrument("p");

      const panVol: Tone.PanVol = new Tone.PanVol(trackControl.pan, trackControl.volume);
      instrument.chain(panVol, Tone.Destination);

      await Tone.loaded();

      const track: TrackType = {
        id: data.trackID,
        name: `Track ${data.trackID}`,
        instrumentName: "p",
        instrument,
        panVol,
        notes: [],
        minNote: 128,
        maxNote: -1,
      };

      console.log(`User ${source} added a new track`);

      setTrackControls((currTrackControls: TrackControlType[]) => {
        return [...currTrackControls, trackControl];
      });
      setTracks((currTracks: TrackType[]) => {
        return [...currTracks, track];
      });
    } else {
      console.error("AddTrack operation failed");
    }
  } catch (error) {
    console.error(`Error adding track: ${error}`);

    // close the connection with Close Code 4400 for generic client-side error
    ws.close(4400);
  }
};

export const updateTrack = () => {};

export const deleteTrack = () => {};
