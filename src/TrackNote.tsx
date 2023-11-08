type TrackNoteProps = {
  left: number;
  top: number;
  width: number;
  height: number;
};

const TrackNote = ({ left, top, width, height }: TrackNoteProps): JSX.Element => {
  return <div className="track-note" style={{ left, top, width, height }} />;
};

export default TrackNote;
