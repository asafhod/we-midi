import Track from "./Track";

type TrackListProps = {
  numTracks: number;
  divisions: number;
  gridPatternWidth: number;
  totalWidth: number;
  scaleWidth: number;
};

const TrackList = ({ numTracks, divisions, gridPatternWidth, totalWidth, scaleWidth }: TrackListProps): JSX.Element => {
  // Figure out exactly how to set up the Track components. Redux/ContextAPI may help clarify.
  //   How to prevent list from re-rendering when a single track is edited (none are added/removed)
  const totalHeight: number = numTracks * 100;
  let trackComponents: JSX.Element[] = [];

  for (let i = 0; i < numTracks; i++) {
    trackComponents[i] = <Track key={i} trackID={i} width={totalWidth} scaleWidth={scaleWidth} />;
  }

  const gridLines: JSX.Element[] = [];

  for (let i = 0; i < divisions; i++) {
    const offset: number = i * Math.round(gridPatternWidth / divisions) + 1;

    gridLines.push(<line key={i} x1={offset} y1="0" x2={offset} y2="100%" stroke="black" strokeWidth="0.6" />);
  }

  return (
    <div className="track-list" style={{ width: totalWidth, height: totalHeight }}>
      <svg className="tracks-grid" width="100%" height="100%">
        <defs>
          <pattern id="grid-pattern" width={gridPatternWidth} height="100%" patternUnits="userSpaceOnUse">
            {gridLines}
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-pattern)" />
      </svg>
      <div className="tracks">{trackComponents}</div>
    </div>
  );
};

export default TrackList;
