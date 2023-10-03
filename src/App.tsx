import { useState } from "react";
import {
  AudioPlayer,
  Audio,
  PlayButton,
  ProgressBar,
  VolumeSlider,
  MuteButton
} from "./Audio";
import "./styles.css";

export const songs = [
  {
    name: "No Fear No More",
    thumbnail: "",
    src: "/audio.webm"
  }
];

export default function App() {
  const [isPlay, setIsPlay] = useState(false);
  const [volume, setVolume] = useState(0.7);

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <AudioPlayer
        play={isPlay}
        setPlay={setIsPlay}
        volume={volume}
        setVolume={setVolume}
      >
        <Audio src={songs[0].src} controls />
        <PlayButton>{isPlay ? "pause" : "play"}</PlayButton>
        time
        <ProgressBar />
        volume
        <VolumeSlider />
        <MuteButton>{volume === 0 ? "unmute" : "mute"}</MuteButton>
      </AudioPlayer>
    </div>
  );
}
