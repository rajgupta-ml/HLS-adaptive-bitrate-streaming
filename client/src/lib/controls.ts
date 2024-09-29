import React from "react";

type ISetState<T> = React.Dispatch<React.SetStateAction<T>>;

export class Controls {
  handlePlayAndPause(controls: HTMLVideoElement | null, isPlaying: boolean, setIsPlaying: ISetState<boolean>, setDuration: ISetState<number>) {
    if (controls) {
      if (isPlaying) {
        controls.pause();
      } else {
        controls.play();
      }
      setIsPlaying(!isPlaying);
      setDuration((controls.duration / 60));
    }
  }

  handleFullScreen(controls: HTMLDivElement | null, setIsFullScreen: ISetState<boolean>) {
    if (!controls) {
      console.error("HandleFullScreen: Something went wrong");
      return;
    }
    if (!document.fullscreenElement) {
      controls.requestFullscreen();
    } else {
      document.exitFullscreen()
    }
    setIsFullScreen((!!document.fullscreenElement));
  }

  setWidthOfProgressFill(progressControls: HTMLDivElement | null, videoElement: HTMLVideoElement, setCurrentTime: ISetState<number>, setProgress: ISetState<number>, setIsPlaying: ISetState<boolean>) {
    const currentTime = videoElement.currentTime;
    const totalDuration = videoElement.duration;
    const totalWidth = progressControls?.clientWidth;
    if (totalDuration <= 0 || !totalWidth || totalWidth <= 0) {
      console.error("setWidthOfProgressFill Error: Invalid duration or width");
      return;
    }
    const progressWidth = (currentTime / totalDuration) * totalWidth;
    if (totalWidth === progressWidth) setIsPlaying(false);
    setProgress(progressWidth);
    setCurrentTime(currentTime / 60);
  }

  handleSkip(
    event: React.MouseEvent<HTMLDivElement>,
    videoElement: HTMLVideoElement | null,
    setCurrentTime: ISetState<number>,
    setProgress: ISetState<number>,
    setIsPlaying: ISetState<boolean>,
    hover: boolean
  ) {
    const progressBar = event.currentTarget;
    if (!progressBar || !videoElement) return;
    const clickX = event.clientX - progressBar.getBoundingClientRect().left;
    const progressBarWidth = progressBar.clientWidth;
    const newTime = (clickX / progressBarWidth) * (videoElement.duration);
    if (!hover) {
      videoElement.currentTime = newTime;
      this.setWidthOfProgressFill(progressBar, videoElement, setCurrentTime, setProgress, setIsPlaying);
    } else {
      setIsPlaying(true);
      const hoverWidth = (newTime / videoElement.duration) * progressBarWidth;
      setProgress(hoverWidth);
    }
  }



  handleMute(
    videoElement: HTMLVideoElement | null,
    setIsMuted: ISetState<boolean>,
    isMuted: boolean,
    setVolume: ISetState<number>
  ) {
    if (!videoElement) return;

    if (isMuted) {
      videoElement.volume = 1;
      videoElement.muted = false;
      setVolume(Number(1));
    } else {
      videoElement.volume = 0;
      videoElement.muted = true;
      setVolume(Number(0));
    }
    setIsMuted(!isMuted);
  }

  handleVolume(volumeBarRef: HTMLInputElement | null, setVolume: ISetState<number>, videoRef: HTMLVideoElement | null) {
    if (!volumeBarRef || !setVolume || !videoRef) return;
    const currentValue = Number(volumeBarRef.value);
    videoRef.volume = currentValue;
    setVolume(currentValue);
  }
}
