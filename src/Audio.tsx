import * as React from "react";
import { mergeRefs } from "./utils";
import { createContextScope } from "@radix-ui/react-context";
import type { Scope } from "@radix-ui/react-context";

// =================

const AUDIO_PLAYER_NAME = "Audio";

type ScopedProps<P> = P & { __scopeAudioPlayer?: Scope };
const [createAudioPlayerContext, createAudioPlayerScope] = createContextScope(
  AUDIO_PLAYER_NAME
);

interface AudioPlayerContextValue {
  audioRef: React.RefObject<HTMLAudioElement>;
  play: boolean;
  onPlayToggle(): void;
  onPlayChange: React.Dispatch<React.SetStateAction<boolean>>;
  onJump(jumpTo: number): void;
  duration: number;
  onSetDuration: React.Dispatch<React.SetStateAction<number>>;
  onUpdateCurrentTime: React.Dispatch<React.SetStateAction<number>>;
  currentTime: number;
  volume: number;
  onChangeVolume: React.Dispatch<React.SetStateAction<number>>;
  prevVolumeRef: React.MutableRefObject<number>;
}

const [AudioPlayerProvider, useAudioPlayerContext] = createAudioPlayerContext<
  AudioPlayerContextValue
>(AUDIO_PLAYER_NAME);

// Root =================
interface AudioPlayerProps {
  children: React.ReactNode;
  play: boolean;
  setPlay: React.Dispatch<React.SetStateAction<boolean>>;
  volume: number;
  setVolume: React.Dispatch<React.SetStateAction<number>>;
}

const AudioPlayer = (props: ScopedProps<AudioPlayerProps>) => {
  const {
    __scopeAudioPlayer,
    children,
    play,
    setPlay,
    volume,
    setVolume
  } = props;
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [duration, setDuration] = React.useState(0);
  const [currentTime, setCurrentTime] = React.useState(0);
  const prevVolumeRef = React.useRef(0);

  return (
    <AudioPlayerProvider
      scope={__scopeAudioPlayer}
      audioRef={audioRef}
      duration={duration}
      onSetDuration={setDuration}
      play={play}
      onPlayChange={setPlay}
      onPlayToggle={() => setPlay(!play)}
      onUpdateCurrentTime={setCurrentTime}
      prevVolumeRef={prevVolumeRef}
      volume={volume}
      onChangeVolume={setVolume}
      currentTime={currentTime}
      onJump={(jumpTo) => {
        setCurrentTime(jumpTo);
      }}
    >
      {children}
    </AudioPlayerProvider>
  );
};

// Audio =====================

const AUDIO_NAME = "Audio";

interface AudioProps extends React.AudioHTMLAttributes<HTMLAudioElement> {}

const Audio = React.forwardRef<HTMLAudioElement, AudioProps>(function Audio(
  props: ScopedProps<AudioProps>,
  forwardedRef
) {
  const { __scopeAudioPlayer, ...audioProps } = props;
  const {
    play,
    audioRef,
    onUpdateCurrentTime,
    onPlayChange,
    onSetDuration,
    onChangeVolume
  } = useAudioPlayerContext(AUDIO_NAME, __scopeAudioPlayer);

  React.useEffect(() => {
    let updateCurrentTimeInterval: NodeJS.Timeout;

    if (play) {
      audioRef.current.play();
      updateCurrentTimeInterval = setInterval(() => {
        onUpdateCurrentTime(Number(audioRef.current.currentTime.toFixed(0)));
      }, 200);
    } else {
      audioRef.current.pause();
      clearInterval(updateCurrentTimeInterval);
    }
    return () => {
      clearInterval(updateCurrentTimeInterval);
    };
  }, [play, audioRef, onUpdateCurrentTime]);

  return (
    <audio
      ref={mergeRefs([audioRef, forwardedRef])}
      onEnded={() => onPlayChange(false)}
      onLoadedMetadata={(e) => {
        onChangeVolume(e.currentTarget.volume);
        onSetDuration(e.currentTarget.duration);
      }}
      {...audioProps}
      controls={false}
    />
  );
});
// PlayButton =======================
const PLAY_BUTTON_NAME = "PlayButton";

interface PlayButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const PlayButton = React.forwardRef<HTMLButtonElement, PlayButtonProps>(
  function PlayButton(props: ScopedProps<PlayButtonProps>, forwardedRef) {
    const { __scopeAudioPlayer, ...playButtonProps } = props;
    const context = useAudioPlayerContext(PLAY_BUTTON_NAME, __scopeAudioPlayer);
    return (
      <button
        disabled={!context.audioRef.current}
        onClick={context.onPlayToggle}
        ref={forwardedRef}
        {...playButtonProps}
      />
    );
  }
);

// ProgressBar ======================
const PROGRESS_BAR_NAME = "ProgressBar";

interface ProgressBarProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}
const ProgressBar = React.forwardRef<HTMLInputElement, ProgressBarProps>(
  function ProgressBar(props: ScopedProps<ProgressBarProps>, forwardedRef) {
    const { __scopeAudioPlayer, ...progressBarProps } = props;
    const context = useAudioPlayerContext(
      PROGRESS_BAR_NAME,
      __scopeAudioPlayer
    );
    const prevPlay = React.useRef(false);

    return (
      <input
        type="range"
        disabled={!context.audioRef.current}
        min="0"
        value={context.currentTime}
        max={context.duration}
        onMouseDown={() => {
          prevPlay.current = context.play;
          context.onPlayChange(false);
        }}
        onMouseUp={() => {
          context.onPlayChange(prevPlay.current);
        }}
        onChange={(e) => {
          const nextJump = Number(e.currentTarget.value);
          context.audioRef.current.currentTime = nextJump;
          context.onJump(nextJump);
        }}
        ref={forwardedRef}
        {...progressBarProps}
      />
    );
  }
);

// VolumeSlider ============
const VOLUME_SLIDER_NAME = "VolumeSlider";

interface VolumeSliderProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const VolumeSlider = React.forwardRef<HTMLInputElement, VolumeSliderProps>(
  function VolumeSlider(props: ScopedProps<VolumeSliderProps>, forwardedRef) {
    const { __scopeAudioPlayer, ...volumeSliderProps } = props;
    const context = useAudioPlayerContext(
      VOLUME_SLIDER_NAME,
      __scopeAudioPlayer
    );
    const VOLUME_STEP_KEYBOARD = 0.2;
    const MAX_VOLUME = 1;
    const MIN_VOLUME = 0;

    React.useEffect(() => {
      context.audioRef.current.volume = context.volume;
    }, [context.volume, context.audioRef]);

    return (
      <input
        disabled={!context.audioRef.current}
        value={context.volume}
        min={MIN_VOLUME}
        max={MAX_VOLUME}
        step="0.001"
        onChange={(e) => {
          const nextVolume = Number(e.currentTarget.value);
          context.prevVolumeRef.current = nextVolume;
          context.onChangeVolume(nextVolume);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            context.onChangeVolume((p) => {
              const nextVolume = p - VOLUME_STEP_KEYBOARD;
              if (nextVolume < MIN_VOLUME) return MIN_VOLUME;
              return nextVolume;
            });
          }
          if (e.key === "ArrowRight") {
            e.preventDefault();
            context.onChangeVolume((p) => {
              const nextVolume = p + VOLUME_STEP_KEYBOARD;
              if (nextVolume > MAX_VOLUME) return MAX_VOLUME;
              return nextVolume;
            });
          }
        }}
        type="range"
        ref={forwardedRef}
        {...volumeSliderProps}
      />
    );
  }
);

// MuteButton ============
const MUTE_BUTTON_NAME = "MuteButton";

interface MuteButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}
const MuteButton = React.forwardRef<HTMLButtonElement, MuteButtonProps>(
  function (props: ScopedProps<MuteButtonProps>, forwardedRef) {
    const { __scopeAudioPlayer, ...muteButtonProps } = props;
    const context = useAudioPlayerContext(MUTE_BUTTON_NAME, __scopeAudioPlayer);
    return (
      <button
        disabled={!context.audioRef.current}
        onClick={() => {
          if (context.volume !== 0) {
            context.prevVolumeRef.current = context.volume;
            context.onChangeVolume(0);
          } else {
            const nextVolume =
              context.prevVolumeRef.current === 0
                ? 0.1
                : context.prevVolumeRef.current;
            context.onChangeVolume(nextVolume);
          }
        }}
        ref={forwardedRef}
        {...muteButtonProps}
      />
    );
  }
);

export {
  createAudioPlayerScope,
  AudioPlayer,
  Audio,
  PlayButton,
  ProgressBar,
  VolumeSlider,
  MuteButton
};
