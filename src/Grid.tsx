import { PropsWithChildren } from "react";

type GridProps = {
  totalHeight: number;
  totalWidth: number;
  gridPatternWidth: number;
  colorPatternWidth: number;
  divisions: number;
  editingMidi: boolean;
  onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>, alsoChangePlayerPos?: boolean) => void;
};

const Grid = ({
  totalHeight,
  totalWidth,
  gridPatternWidth,
  colorPatternWidth,
  divisions,
  editingMidi,
  onClick,
  children,
}: PropsWithChildren<GridProps>): JSX.Element => {
  const gridLines: JSX.Element[] = [];

  for (let i = 0; i < divisions; i++) {
    const offset: number = Math.round((i * gridPatternWidth) / divisions) + 1;
    const strokeColor: string = editingMidi && i === 0 ? "#4D545C" : "#32373C";

    gridLines.push(<line key={i} x1={offset} y1="0" x2={offset} y2="100%" stroke={strokeColor} strokeWidth="0.6" />);
  }

  const colorHighlightWidth: number = colorPatternWidth / 2;

  return (
    <div className="grid-wrapper" style={{ width: totalWidth, height: totalHeight }} onClick={onClick}>
      <svg className="grid-svg" width="100%" height={totalHeight}>
        <defs>
          <pattern id="grid-pattern" width={gridPatternWidth} height="100%" patternUnits="userSpaceOnUse">
            {gridLines}
          </pattern>
          {editingMidi ? (
            <pattern id="midi-color-pattern" width="1" height="288" patternUnits="userSpaceOnUse">
              <rect width="1" height="24" fill="#282C32" />
              <rect y="24" width="1" height="24" fill="#282C32" />
              <rect y="48" width="1" height="24" fill="#181D20" />
              <rect y="72" width="1" height="24" fill="#282C32" />
              <rect y="96" width="1" height="24" fill="#181D20" />
              <rect y="120" width="1" height="24" fill="#282C32" />
              <rect y="144" width="1" height="24" fill="#181D20" />
              <rect y="168" width="1" height="24" fill="#282C32" />
              <rect y="192" width="1" height="24" fill="#282C32" />
              <rect y="216" width="1" height="24" fill="#181D20" />
              <rect y="240" width="1" height="24" fill="#282C32" />
              <rect y="264" width="1" height="24" fill="#181D20" />
            </pattern>
          ) : (
            <pattern id="color-pattern" width={colorPatternWidth} height="100%" patternUnits="userSpaceOnUse">
              <rect width={colorHighlightWidth} height="100%" fill="#00000024" />
            </pattern>
          )}
        </defs>
        {editingMidi ? (
          <rect width="100%" height="100%" fill="url(#midi-color-pattern)" />
        ) : (
          <rect width="100%" height="100%" fill="url(#color-pattern)" />
        )}
        <rect width="100%" height="100%" fill="url(#grid-pattern)" />
      </svg>
      {children}
    </div>
  );
};

export default Grid;
