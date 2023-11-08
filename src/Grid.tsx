import { PropsWithChildren } from "react";

type GridProps = {
  totalHeight: number;
  totalWidth: number;
  gridPatternWidth: number;
  colorPatternWidth: number;
  divisions: number;
  onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>, alsoChangePlayerPos?: boolean) => void;
};

const Grid = ({
  totalHeight,
  totalWidth,
  gridPatternWidth,
  colorPatternWidth,
  divisions,
  onClick,
  children,
}: PropsWithChildren<GridProps>): JSX.Element => {
  const gridLines: JSX.Element[] = [];

  for (let i = 0; i < divisions; i++) {
    const offset: number = Math.round((i * gridPatternWidth) / divisions) + 1;

    gridLines.push(<line key={i} x1={offset} y1="0" x2={offset} y2="100%" stroke="#32373c" strokeWidth="0.6" />);
  }

  const colorHighlightWidth: number = colorPatternWidth / 2;

  return (
    <div className="grid-wrapper" style={{ width: totalWidth, height: totalHeight }} onClick={onClick}>
      <svg className="grid-svg" width="100%" height={totalHeight}>
        <defs>
          <pattern id="grid-pattern" width={gridPatternWidth} height="100%" patternUnits="userSpaceOnUse">
            {gridLines}
          </pattern>
          <pattern id="color-pattern" width={colorPatternWidth} height="100%" patternUnits="userSpaceOnUse">
            <rect width={colorHighlightWidth} height="100%" fill="#00000024" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#color-pattern)" />
        <rect width="100%" height="100%" fill="url(#grid-pattern)" />
      </svg>
      {children}
    </div>
  );
};

export default Grid;
