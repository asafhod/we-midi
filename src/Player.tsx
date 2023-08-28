import { useState, useEffect } from "react";
import * as Tone from "tone";

const Player = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [startPosition, setStartPosition] = useState("0:0:0");
  const [playerPosition, setPlayerPosition] = useState("0:0:0");

  const formatPosition = (position: string) => {
    const [whole] = position.split(".");
    const [measures, beats] = whole.split(":");

    return `${Number(measures) + 1}:${Number(beats) + 1}`;
  };

  const togglePlay = () => {
    if (isPlaying) {
      Tone.Transport.stop();
      Tone.Transport.position = startPosition;
      setIsPlaying(false);
      setPlayerPosition(Tone.Transport.position);
    } else {
      Tone.Transport.start();
      setIsPlaying(true);
    }
  };

  const changeStartPosition = (newStartPosition: string) => {
    setStartPosition(newStartPosition);

    if (!isPlaying) {
      Tone.Transport.position = newStartPosition;
      setPlayerPosition(Tone.Transport.position);
    }
  };

  const changePlayerPosition = (newPlayerPosition: string) => {
    if (isPlaying) {
      Tone.Transport.position = newPlayerPosition;
      setPlayerPosition(newPlayerPosition);
    }
  };

  useEffect(() => {
    Tone.Transport.scheduleRepeat(() => {
      setPlayerPosition(String(Tone.Transport.position));
    }, "4n"); // can use smaller note duration if need to update more frequently
    // clear it in a cleanup function?
  }, [setPlayerPosition]);

  return (
    <>
      <button type="button" onClick={togglePlay}>
        {isPlaying ? "Stop" : "Play"}
      </button>
      <input type="text" value={startPosition} onChange={(e) => changeStartPosition(e.target.value)} />
      {formatPosition(playerPosition)}
      <button type="button" onClick={() => changePlayerPosition("2:0:0")}>
        Test
      </button>
    </>
  );
};

export default Player;
