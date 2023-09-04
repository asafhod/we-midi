import Track from "./Track";

type TrackListProps = {
  numTracks: number;
  trackHeight: number;
  divisions: number;
  gridPatternWidth: number;
  totalWidth: number;
  scaleWidth: number;
};

const TrackList = ({ numTracks, trackHeight, divisions, gridPatternWidth, totalWidth, scaleWidth }: TrackListProps): JSX.Element => {
  // Figure out exactly how to set up the Track components. Redux/ContextAPI may help clarify.
  //   How to prevent list from re-rendering when a single track is edited (none are added/removed)
  const totalHeight: number = numTracks * trackHeight;
  let trackComponents: JSX.Element[] = [];

  for (let i = 0; i < numTracks; i++) {
    trackComponents[i] = <Track key={i} trackID={i} width={totalWidth} height={trackHeight} scaleWidth={scaleWidth} />;
  }

  const gridLines: JSX.Element[] = [];

  for (let i = 0; i < divisions; i++) {
    const offset: number = Math.round((i * gridPatternWidth) / divisions) + 1;

    gridLines.push(<line key={i} x1={offset} y1="0" x2={offset} y2="100%" stroke="black" strokeWidth="0.6" />);
    if (i === 4) console.log(offset);
  }

  return (
    <div className="track-list" style={{ width: totalWidth, height: totalHeight }}>
      <svg className="tracks-grid" width="100%" height={totalHeight}>
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
