import * as Tone from "tone";
import { useState, useEffect, useMemo, useContext } from "react";
import TracksContext from "./TracksContext";
import { TrackType, NoteType, RegionType, ProjectUser } from "./types";

type TrackProps = {
  track: TrackType;
  width: number;
  height: number;
  widthFactor: number;
  setNextMidiEditorTrackID: React.Dispatch<React.SetStateAction<number>>;
};

const Track = ({ track, width, height, widthFactor, setNextMidiEditorTrackID }: TrackProps): JSX.Element => {
  // TODO: Stop getting tracks from context?
  const { projectUsers, tracks } = useContext(TracksContext)!;
  const [regions, setRegions] = useState<RegionType[]>([]);

  const { id } = track;

  // TODO: "Multiple"
  const editingUser: string | undefined = useMemo(() => {
    return projectUsers.find((pu: ProjectUser) => pu.currentView === id)?.username;
  }, [projectUsers, id]);

  const notes: JSX.Element[] = [];

  if (track.notes.length) {
    const { minNote, maxNote } = track;

    const noteRange: number = maxNote - minNote;

    const heightWithoutBorder: number = height - 2;
    const heightScale: number = noteRange <= 10 && noteRange !== 0 ? 0.6 : 1;
    const scaledHeight: number = Math.round(heightWithoutBorder * heightScale);
    const heightOffset: number = Math.round((heightWithoutBorder - scaledHeight) / 2);

    const noteHeight: number = noteRange === 0 ? 5 : Math.min(Math.round((scaledHeight / noteRange) * heightScale), 5);
    const availableTrackHeight: number = scaledHeight - noteHeight;

    for (const note of track.notes) {
      const noteLeft: number = Math.round(note.noteTime * widthFactor) + 1;
      const noteWidth: number = Math.max(Math.round(Number(note.duration) * widthFactor), 1);

      const normalizedNotePosition: number = noteRange === 0 ? 0.5 : 1 - (note.midiNum - minNote) / noteRange;
      const noteTop: number = Math.round(normalizedNotePosition * availableTrackHeight) + heightOffset;

      notes.push(<TrackNote key={note.clientNoteID} left={noteLeft} top={noteTop} width={noteWidth} height={noteHeight} />);
    }
  }

  const generateRegions = () => {
    const addRegion = (note: NoteType, regions: RegionType[], measureLength: number) => {
      const regionStartTime: number = note.noteTime;
      const regionDuration: number = Math.max(Number(note.duration), measureLength);
      const regionNotes: NoteType[] = [note];

      regions.push({ startTime: regionStartTime, endTime: regionStartTime + regionDuration, notes: regionNotes });
    };

    const mergeRegions = (regions: RegionType[], regionGap: number): RegionType[] => {
      // Once this is all done, simplify as much as possible. Then check with GPT if it can be simplified even further.
      let mergeGroups: number[][] = [];

      // Min/Max compared to existing Min/Max - Don't need anymore, right?
      // Check for other relevant factors - Way to do it in one run with one regions array and ignore logic?
      //   Can be problematic if you finish comparing two regions, but then one merges with one you didn't compare with
      for (let i = 0; i < regions.length; i++) {
        for (let j = i + 1; j < regions.length; j++) {
          let mergeGroupIndexI: number = mergeGroups.findIndex((mergeGroup) => mergeGroup.includes(i));
          const mergeGroupIndexJ: number = mergeGroups.findIndex((mergeGroup) => mergeGroup.includes(j));

          // simplify it as much as possible
          if (!(regions[i].startTime - regions[j].endTime >= regionGap) && !(regions[j].startTime - regions[i].endTime >= regionGap)) {
            if (mergeGroupIndexI !== -1 && mergeGroupIndexJ !== -1) {
              // combine groups and eliminate repeats
              const merged: Set<number> = new Set([...mergeGroups[mergeGroupIndexI], ...mergeGroups[mergeGroupIndexJ]]);
              mergeGroups[mergeGroupIndexI] = Array.from(merged);
              mergeGroups = mergeGroups.filter((_mergeGroup, index) => index !== mergeGroupIndexJ);
            } else if (mergeGroupIndexI !== -1) {
              mergeGroups[mergeGroupIndexI].push(j);
            } else if (mergeGroupIndexJ !== -1) {
              mergeGroups[mergeGroupIndexJ].push(i);
            } else {
              mergeGroups.push([i, j]);
            }
          }
        }
      }

      if (mergeGroups.length) {
        const mergedRegions: RegionType[] = [];

        for (let i = 0; i < mergeGroups.length; i++) {
          // for each group, get minStart and maxEnd out of all regions
          // then create a region with that start and end. For its notes array, concatenate the notes from all the regions in the group
          // add that region to merged regions
          const firstRegion: RegionType = regions[mergeGroups[i][0]];
          let startTime: number = firstRegion.startTime;
          let endTime: number = firstRegion.endTime;
          const notes: NoteType[] = [...firstRegion.notes]; // best to copy it like this, right?

          for (let j = 1; j < mergeGroups[i].length; j++) {
            const region: RegionType = regions[mergeGroups[i][j]];

            notes.push(...region.notes);
            startTime = Math.min(startTime, region.startTime);
            endTime = Math.max(endTime, region.endTime);
          }

          mergedRegions.push({ startTime, endTime, notes });
        }

        // TODO: Filter regions using the mergeGroups keys to remove all merge regions (flattened and in descending order to prevent mutation errors)
        // Then push its contents to mergedRegions. This should retain the regions that do not need merging post-merge.
        // Then clean up. Maybe it's worth using IDs after all to avoid the descending order thing?

        return mergedRegions;
      }

      return regions;
    };

    // TODO: Make sure copying state values safely. Ask ChatGPT.
    const notes: NoteType[] = track.notes;
    const measureLength: number = 4 * (60 / Tone.Transport.bpm.value);
    const regionGap: number = measureLength * 2;
    let newRegions: RegionType[] = [];

    for (let i = 0; i < notes.length; i++) {
      const note: NoteType = notes[i];

      if (i === 0) {
        addRegion(note, newRegions, measureLength);
      } else {
        for (let j = 0; j < newRegions.length; j++) {
          const region: RegionType = newRegions[j];

          const noteEndTime: number = note.noteTime + Number(note.duration);

          if (note.noteTime >= region.startTime && note.noteTime <= region.endTime) {
            region.notes.push(note);
            region.endTime = Math.max(region.endTime, noteEndTime);
            break;
          } else if (noteEndTime >= region.startTime && noteEndTime <= region.endTime) {
            region.notes.push(note);
            region.startTime = Math.min(region.startTime, note.noteTime);
            break;
            // simplify
          } else if (noteEndTime < region.startTime && region.startTime - noteEndTime < regionGap) {
            region.notes.push(note);
            region.startTime = note.noteTime;
            break;
          } else if (note.noteTime > region.endTime && note.noteTime - region.endTime < regionGap) {
            region.notes.push(note);
            region.endTime = noteEndTime;
            break;
            // simplify
          } else if (note.noteTime < region.startTime && noteEndTime > region.endTime) {
            region.notes.push(note);
            region.startTime = note.noteTime;
            region.endTime = noteEndTime;
            break;
          } else if (j === newRegions.length - 1) {
            addRegion(note, newRegions, measureLength);
          }
        }
      }
    }

    // merge regions
    newRegions = mergeRegions(newRegions, regionGap);

    setRegions(newRegions);
  };

  useEffect(() => {
    // TODO: If you keep this logic here, fix the deps
    generateRegions();
  }, [tracks]);

  return (
    <div className="track" style={{ width, height }} onDoubleClick={() => setNextMidiEditorTrackID(id)}>
      {/* TODO: Formatting, move to css sheet, etc. */}
      {editingUser && <span style={{ position: "absolute" }}>{editingUser} editing...</span>}
      {regions.map((region, i) => {
        return (
          <div
            className="region"
            key={i}
            style={{
              left: Math.round(region.startTime * widthFactor) + 1,
              width: Math.round((region.endTime - region.startTime) * widthFactor),
              height: height - 2,
            }}
          />
        );
      })}
      {notes}
    </div>
  );
};

type TrackNoteProps = {
  left: number;
  top: number;
  width: number;
  height: number;
};

const TrackNote = ({ left, top, width, height }: TrackNoteProps): JSX.Element => {
  return <div className="track-note" style={{ left, top, width, height }} />;
};

export default Track;
