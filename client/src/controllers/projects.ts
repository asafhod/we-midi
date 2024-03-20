import * as Tone from "tone";
import { Message, SongData, TrackType, NoteType, TrackControlType, ProjectUser } from "../types";
import { noteNames } from "../noteNames";
import createInstrument from "../instruments/createInstrument";
import { sortProjectUsers, colors } from "./projectUsers";

export const loadProject = async (
  ws: WebSocket,
  message: Message,
  username: string | undefined,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setSongData: React.Dispatch<React.SetStateAction<SongData>>,
  setTracks: React.Dispatch<React.SetStateAction<TrackType[]>>,
  setTrackControls: React.Dispatch<React.SetStateAction<TrackControlType[]>>,
  setTempo: React.Dispatch<React.SetStateAction<string>>,
  setProjectUsers: React.Dispatch<React.SetStateAction<ProjectUser[]>>
) => {
  try {
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

        notes.push({ clientNoteID: id, noteID, name: noteName, midiNum, duration, noteTime, velocity });

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
          Tone.Transport.clear(note.clientNoteID);
        }

        track.panVol.dispose();
        track.instrument.dispose();
      }

      return tracks;
    });
    setTempo(String(Tone.Transport.bpm.value));
    setSongData({ name: data.project.name, tempo: Tone.Transport.bpm.value, trackIDs });
    setProjectUsers((currProjectUsers: ProjectUser[]) => {
      // TODO: Test, then get rid of this commented code
      // for (const existingProjectUser of currProjectUsers) {
      //   const projectUser: ProjectUser | undefined = data.projectUsers.find(
      //     (pu: ProjectUser) => pu.isOnline && pu.username === existingProjectUser.username
      //   );

      //   if (projectUser) projectUser.currentView = existingProjectUser.currentView;
      // }

      for (const projectUser of data.projectUsers) {
        if (projectUser.isOnline) {
          const existingProjectUser: ProjectUser | undefined = currProjectUsers.find(
            (pu: ProjectUser) => pu.username === projectUser.username
          );

          if (existingProjectUser) projectUser.currentView = existingProjectUser.currentView;
          if (projectUser.username === username) projectUser.currentView = 0;
        }

        if (typeof projectUser.color === "number") projectUser.color = colors[projectUser.color];
      }

      return sortProjectUsers(data.projectUsers);
    });
    setLoading(false);
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

      const trackName: string = `Track ${data.trackID}`;

      const instrument: Tone.Sampler = createInstrument("p");
      const panVol: Tone.PanVol = new Tone.PanVol(trackControl.pan, trackControl.volume);
      instrument.chain(panVol, Tone.Destination);

      await Tone.loaded();

      const track: TrackType = {
        id: data.trackID,
        name: trackName,
        instrumentName: "p",
        instrument,
        panVol,
        notes: [],
        minNote: 128,
        maxNote: -1,
      };

      console.log(`User ${source} added new track: ${trackName}`);

      setTrackControls((currTrackControls: TrackControlType[]) => {
        return [...currTrackControls, trackControl];
      });
      setTracks((currTracks: TrackType[]) => {
        return [...currTracks, track];
      });
    } else {
      console.error(`Server could not add track: ${message.msg}`);
    }
  } catch (error) {
    console.error(`Error adding track: ${error}`);

    // close the connection with Close Code 4400 for generic client-side error
    ws.close(4400);
  }
};

export const updateTrack = () => {};

export const deleteTrack = (
  ws: WebSocket,
  message: Message,
  setTracks: React.Dispatch<React.SetStateAction<TrackType[]>>,
  setTrackControls: React.Dispatch<React.SetStateAction<TrackControlType[]>>
) => {
  try {
    if (message.success) {
      const DEFAULT_PPQ: number = 480;

      const { source, data } = message;

      setTrackControls((currTrackControls: TrackControlType[]) => {
        return currTrackControls.filter((trackControl: TrackControlType) => trackControl.id !== data.trackID);
      });

      setTracks((currTracks: TrackType[]) => {
        const newTracks: TrackType[] = currTracks.filter((track: TrackType) => {
          if (track.id === data.trackID) {
            for (const note of track.notes) {
              Tone.Transport.clear(note.clientNoteID);
            }

            track.panVol.dispose();
            track.instrument.dispose();

            if (currTracks.length === 1 && Tone.Transport.PPQ !== DEFAULT_PPQ) {
              // if last remaining track is being deleted and PPQ is not the default value, reset it to the default value (in case a MIDI import changed it)
              Tone.Transport.PPQ = DEFAULT_PPQ;
            }

            console.log(`User ${source} deleted track: ${track.name}`);

            return false;
          }
          return true;
        });

        return newTracks;
      });
    } else {
      console.error(`Server could not delete track: ${message.msg}`);
    }
  } catch (error) {
    console.error(`Error deleting track: ${error}`);

    // close the connection with Close Code 4400 for generic client-side error
    ws.close(4400);
  }
};
