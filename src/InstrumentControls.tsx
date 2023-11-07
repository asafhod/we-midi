import { useMemo } from "react";
import { TrackType } from "./types";

type InstrumentControlsProps = {
  track: TrackType;
};

const InstrumentControls = ({ track }: InstrumentControlsProps) => {
  const playNote = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const target = e.target as HTMLDivElement;
    const noteName: string | undefined = target.dataset.note;

    if (noteName) {
      track.instrument.triggerAttackRelease(noteName, 0.35);
      //   track.instrument.triggerAttackRelease(noteName, 0.25, time, velocity);
    }
  };

  const instrumentNotes: JSX.Element[] = useMemo(() => {
    const instrumentNotes: JSX.Element[] = [];
    const pitches: string[] = ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"];

    for (let i = 87; i >= 0; i--) {
      const pitch: string = pitches[i % 12];
      const isSharp: boolean = pitch.length === 2;
      const octave: string = String(i < 3 ? 0 : Math.floor((i - 3) / 12) + 1);
      const note: string = pitch + octave;

      instrumentNotes.push(
        <div key={i} className={isSharp ? "instrument-note-sharp" : "instrument-note"} data-note={note}>
          {note}
        </div>
      );
    }

    return instrumentNotes;
  }, []);

  return (
    <div className="instrument-controls" onClick={(e) => playNote(e)}>
      {instrumentNotes}
    </div>
  );
};

export default InstrumentControls;
