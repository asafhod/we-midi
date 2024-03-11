// import * as Tone from "tone";
// import { Midi as MidiLoad, MidiJSON, TrackJSON } from "@tonejs/midi";
// import { useState, useEffect, useRef } from "react";
// import { useNavigate } from "react-router-dom";
// import { SongData, TrackControlType, TrackType, NoteType } from "./types";
// import createInstrument from "./instruments/createInstrument";
// import midiURL from "./assets/MIDI_sample.mid"; // Get rid of this later
// import midiURL2 from "./assets/teddybear.mid"; // Get rid of this later

// type LoadedSong = {
//   loading: boolean;
//   setLoading: React.Dispatch<React.SetStateAction<boolean>>;
//   songData: SongData;
//   setSongData: React.Dispatch<React.SetStateAction<SongData>>;
//   tracks: TrackType[];
//   setTracks: React.Dispatch<React.SetStateAction<TrackType[]>>;
//   trackControls: TrackControlType[];
//   setTrackControls: React.Dispatch<React.SetStateAction<TrackControlType[]>>;
//   tempo: string; // Move this to Workspace?
//   setTempo: React.Dispatch<React.SetStateAction<string>>; // Move this to Workspace?
// };

// const useLoadSong = (
//   id: string | undefined,
//   midiFile: File | null,
//   setMidiFile: React.Dispatch<React.SetStateAction<File | null>>
// ): LoadedSong => {
//   const [loading, setLoading] = useState(true);
//   // TODO: If you keep trackIDs and trackControls account for them when adding/removing tracks
//   const [songData, setSongData] = useState<SongData>({ tempo: -1, lastTrackID: 0, trackIDs: [] }); // TODO: Split into Global and Local
//   const [tracks, setTracks] = useState<TrackType[]>([]); // TODO: make sure you're getting tracks consistently across components
//   const [trackControls, setTrackControls] = useState<TrackControlType[]>([]);
//   const [tempo, setTempo] = useState(String(songData.tempo));
//   const blockReloadRef = useRef(false);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const readMidi = (file: File): Promise<MidiJSON> => {
//       return new Promise((resolve, reject) => {
//         const reader: FileReader = new FileReader();

//         reader.onload = () => {
//           if (reader.result instanceof ArrayBuffer) {
//             const binaryData: Uint8Array = new Uint8Array(reader.result);
//             const midi: MidiLoad = new MidiLoad(binaryData);

//             // TODO: Also ban midi files with more than 100 tracks or ones that are too long
//             if (!midi || !Object.keys(midi).length) reject("Cannot load song: Invalid MIDI file");

//             console.log(midi);
//             resolve(midi);
//           } else {
//             reject("Cannot load song: Invalid MIDI file");
//           }
//         };

//         reader.onerror = () => {
//           reject("Cannot load song: Error reading MIDI file");
//         };

//         reader.readAsArrayBuffer(file);
//       });
//     };

//     // TODO: Set up conditions to prevent running when it should not. Address any new scenarios in cleanup function.
//     const loadMidi = async () => {
//       if (blockReloadRef.current) {
//         // TODO: Jank?
//         blockReloadRef.current = false;
//         return;
//       }
//       // TODO: Retrieve song data from database (with these as the defaults)
//       let trackIDs: number[] = [];
//       let trackControls: TrackControlType[] = [];
//       let lastTrackID: number = 0;
//       let midi: MidiJSON | null = null;
//       let ppq: number = 480;
//       let bpm: number = 120;
//       let newID: number = 0;

//       if (id) {
//         //  TODO: Load data here from the db using the id to build the url
//         lastTrackID = 6;

//         if (midiFile) {
//           midi = await readMidi(midiFile);
//         } else {
//           // Test Data
//           let url: string = "";
//           if (id === "1") {
//             url = midiURL;
//             trackIDs = [1, 2, 3, 4, 5, 6];
//             trackControls = [
//               { id: 1, volume: -1, muted: false, solo: false, pan: 0 },
//               { id: 2, volume: -3, muted: false, solo: false, pan: 0 },
//               { id: 3, volume: 8, muted: false, solo: false, pan: 0 },
//               { id: 4, volume: 8, muted: false, solo: false, pan: 0 },
//               { id: 5, volume: -3, muted: false, solo: false, pan: 0 },
//               { id: 6, volume: 0, muted: false, solo: false, pan: 0 },
//             ];
//           } else if (id === "2") {
//             url = midiURL2;
//             trackIDs = [1, 2, 3, 4];
//             trackControls = [
//               { id: 1, volume: -3, muted: false, solo: false, pan: 0 },
//               { id: 2, volume: -3, muted: false, solo: false, pan: 0 },
//               { id: 3, volume: -3, muted: false, solo: false, pan: 0 },
//               { id: 4, volume: -3, muted: false, solo: false, pan: 0 },
//             ];
//           }

//           midi = await MidiLoad.fromUrl(url); // TODO: Load midi from db
//           if (!midi || !Object.keys(midi).length) throw new Error("Cannot load song: No valid MIDI file found");

//           if (midi.tracks.length - 1 !== trackControls.length || midi.tracks.length - 1 !== trackIDs.length) {
//             throw new Error("Cannot load song: Invalid meta data for MIDI tracks");
//           }

//           console.log(midi);
//         }

//         ppq = midi.header.ppq;
//         if (midi.header.tempos.length) bpm = midi.header.tempos[0].bpm;
//       } else {
//         // save new project to db, get newID
//         newID = 3;
//       }

//       await Tone.start();

//       Tone.Transport.PPQ = ppq;
//       Tone.Transport.bpm.value = bpm;

//       if (midi) {
//         const tracks: TrackType[] = [];

//         for (let i = 1; i < midi.tracks.length; i++) {
//           const track: TrackJSON = midi.tracks[i];

//           const trackControl: TrackControlType = midiFile
//             ? { id: lastTrackID + i, volume: -16, muted: false, solo: false, pan: 0 }
//             : trackControls[i - 1];

//           const { instrument, instrumentName } = createInstrument(track.instrument.family, track.instrument.number);
//           const panVol: Tone.PanVol = new Tone.PanVol(trackControl.pan, trackControl.volume);
//           instrument.chain(panVol, Tone.Destination);

//           await Tone.loaded();

//           const notes: NoteType[] = [];
//           let minNote: number = 128;
//           let maxNote: number = -1;

//           for (const { name, midi: midiNum, duration, time: noteTime, velocity } of track.notes) {
//             const noteID: number = Tone.Transport.schedule((time) => {
//               instrument.triggerAttackRelease(name, duration, time, velocity);
//             }, noteTime);

//             notes.push({ id: noteID, name, midiNum, duration, noteTime, velocity });

//             minNote = Math.min(minNote, midiNum);
//             maxNote = Math.max(maxNote, midiNum);
//           }

//           trackIDs.push(trackControl.id);

//           if (midiFile) {
//             trackControls.push(trackControl);
//             if (i === midi.tracks.length - 1) lastTrackID = trackControl.id;
//           }

//           tracks.push({
//             id: trackControl.id,
//             name: track.name || `Track ${trackControl.id}`,
//             instrumentName,
//             instrument,
//             panVol,
//             notes,
//             minNote,
//             maxNote,
//           });
//         }

//         setTrackControls(trackControls);
//         setTracks((currTracks) => {
//           for (const track of currTracks) {
//             for (const note of track.notes) {
//               Tone.Transport.clear(note.id);
//             }

//             track.panVol.dispose();
//             track.instrument.dispose();
//           }

//           return tracks;
//         });

//         if (midiFile) {
//           blockReloadRef.current = true;
//           setMidiFile(null);
//         }
//       }

//       setTempo(String(Tone.Transport.bpm.value));
//       setSongData({ tempo: Tone.Transport.bpm.value, lastTrackID, trackIDs });
//       setLoading(false);

//       if (newID) {
//         blockReloadRef.current = true;
//         navigate(`./${newID}`);
//       }
//     };

//     try {
//       loadMidi();
//     } catch (error) {
//       console.error(error);
//       setMidiFile(null);
//       setLoading(false);
//     }

//     return () => {
//       if (!blockReloadRef.current) {
//         Tone.Transport.stop();
//         Tone.Transport.cancel();

//         setTracks((currTracks) => {
//           for (const track of currTracks) {
//             track.panVol.dispose();
//             track.instrument.dispose();
//           }

//           return [];
//         });
//       }
//     };
//   }, [id, midiFile, setMidiFile, navigate]);

//   return { loading, setLoading, songData, setSongData, tracks, setTracks, trackControls, setTrackControls, tempo, setTempo };
// };

export default {};
