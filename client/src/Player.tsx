import { useEffect, useRef } from "react";
import * as Tone from "tone";

type playerProps = {
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  startPosition: number;
  playerPosition: number;
  setPlayerPosition: React.Dispatch<React.SetStateAction<number>>;
  autoscrollBlocked: boolean;
  setAutoscrollBlocked: React.Dispatch<React.SetStateAction<boolean>>;
  numMeasures: number;
};

const Player = ({
  isPlaying,
  setIsPlaying,
  startPosition,
  playerPosition,
  setPlayerPosition,
  autoscrollBlocked,
  setAutoscrollBlocked,
  numMeasures,
}: playerProps): JSX.Element => {
  const posSamplerEventIDRef = useRef(-1);
  const posRoundedToSec: number = Math.round(playerPosition);
  const minute: number = Math.floor(posRoundedToSec / 60);
  const second: number = posRoundedToSec % 60;

  const measureBeat: string[] = Tone.TransportTime(playerPosition).toBarsBeatsSixteenths().split(".")[0].split(":");
  const measure: number = Number(measureBeat[0]) + 1;
  const beat: number = Number(measureBeat[1]) + 1;

  const start = () => {
    Tone.Transport.start();
    setIsPlaying(true);
  };

  const stop = () => {
    Tone.Transport.stop();
    Tone.Transport.seconds = startPosition;
    setIsPlaying(false);
    setPlayerPosition(startPosition);

    if (autoscrollBlocked) setAutoscrollBlocked(false);
  };

  const togglePlay = () => {
    if (isPlaying) {
      stop();
    } else {
      start();
    }
  };

  // automatically stop if player reaches end of song
  if (isPlaying && measure > numMeasures) stop();

  useEffect(() => {
    const eventID: number = Tone.Transport.scheduleRepeat((time) => {
      Tone.Draw.schedule(() => {
        if (Tone.Transport.state !== "stopped") setPlayerPosition(Math.max(Tone.Transport.seconds - 0.085, 0));
      }, time); // 0.085 second offset is compromise between desktop and mobile latencies
    }, "32n"); // TODO: Change for diff tempos?
    posSamplerEventIDRef.current = eventID;

    return () => {
      // clear repeating setPlayerPosition event from transport in cleanup function
      Tone.Transport.clear(posSamplerEventIDRef.current);
      posSamplerEventIDRef.current = -1;
    };
  }, [setPlayerPosition]);

  return (
    <>
      <button type="button" className="play-button" onClick={togglePlay}>
        {isPlaying ? "Stop" : "Play"}
      </button>
      {`${minute}:${second < 10 ? "0" : ""}${second} / ${measure} bar ${beat} beat`}
    </>
  );
};

export default Player;
