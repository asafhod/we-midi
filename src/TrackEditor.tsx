import { useState } from "react";
import Ruler from "./Ruler";
import TrackList from "./TrackList";

type TrackEditorProps = {
  numTracks: number;
};

const TrackEditor = ({ numTracks }: TrackEditorProps): JSX.Element => {
  const [zoom, setZoom] = useState(1);
  const [trackHeight, setTrackHeight] = useState(78);

  const zoomFactor: number = 1.067;
  const zoomMin: number = 0.104;
  const zoomMax: number = 67.708;

  const trackHeightMin: number = 30;
  const trackHeightMax: number = 200;

  const numMeasures: number = 450;
  const widthFactor: number = 76.824;

  const groupMeasures: boolean = zoom < 0.678;
  const segmentIsBeat: boolean = zoom > 2.644;

  let measuresPerSegment: number = 1;
  let divisions: number = 4;

  if (groupMeasures) {
    if (zoom > 0.311) measuresPerSegment = 2;
    else if (zoom > 0.211) measuresPerSegment = 3;
    else if (zoom > 0.153) measuresPerSegment = 4;
    else if (zoom > 0.126) measuresPerSegment = 5;
    else if (zoom > 0.104) measuresPerSegment = 6;
    else measuresPerSegment = 7;

    divisions = measuresPerSegment;
  } else if (zoom > 1.574) {
    if (segmentIsBeat) measuresPerSegment = 0.25;

    divisions = zoom < 6.996 ? 8 : 16;
  }

  const numSegments: number = Math.ceil(numMeasures / measuresPerSegment);

  const segmentWidth: number = Math.round(zoom * widthFactor * measuresPerSegment);
  const gridPatternWidth: number = segmentIsBeat ? segmentWidth * 4 : segmentWidth;

  const scaleWidth: number = zoom * 38.4;
  const totalWidth: number = segmentWidth * numSegments;

  const zoomIn = () => {
    setZoom(Math.min(Math.round(zoom * zoomFactor * 1000) / 1000, zoomMax));
  };

  const zoomOut = () => {
    setZoom(Math.max(Math.round((zoom / zoomFactor) * 1000) / 1000, zoomMin));
  };

  const scrollWheelZoom = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY > 0) {
      zoomOut();
    } else if (e.deltaY < 0) {
      zoomIn();
    }
  };

  return (
    <div className="track-editor" onWheel={(e) => scrollWheelZoom(e)}>
      Zoom:
      <button className="zoom-button" type="button" onClick={zoomOut}>
        -
      </button>
      <button className="zoom-button" type="button" onClick={zoomIn}>
        +
      </button>
      Track Height:
      <button className="zoom-button" type="button" onClick={() => setTrackHeight(Math.max(trackHeight - 5, trackHeightMin))}>
        -
      </button>
      <button className="zoom-button" type="button" onClick={() => setTrackHeight(Math.min(trackHeight + 5, trackHeightMax))}>
        +
      </button>
      <Ruler
        numSegments={numSegments}
        segmentWidth={segmentWidth}
        measuresPerSegment={measuresPerSegment}
        segmentIsBeat={segmentIsBeat}
        divisions={divisions}
        markerPatternWidth={gridPatternWidth}
        totalWidth={totalWidth}
      />
      <TrackList
        numTracks={numTracks}
        trackHeight={trackHeight}
        divisions={divisions}
        gridPatternWidth={gridPatternWidth}
        totalWidth={totalWidth}
        scaleWidth={scaleWidth}
      />
    </div>
  );
};

export default TrackEditor;
