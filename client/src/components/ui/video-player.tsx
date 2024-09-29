import { Controls } from "@/lib/controls";
import { Maximize, Minimize, Play, Pause, Settings, VolumeX, Volume2, Volume1 } from "lucide-react";

import { useEffect, useRef, useState } from "react";
export default function VideoPlayer() {
  const controls = new Controls();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const volumeBarRef = useRef<HTMLInputElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [currentDuration, setCurrentDuration] = useState<number>(0);
  const [currentProgressWidth, setCurrentProgressWidth] = useState<number>(0);
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const [hoverProgressWidth, setHoverProgressWidth] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [volumeHover, setVolumeHover] = useState<boolean>(false);


  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleLoadedMetadata = (event: Event) => {
      const target = event.target as HTMLVideoElement;
      setVideoDuration((target.duration / 60))
      setCurrentDuration((target.currentTime / 60))
      setIsMuted(target.muted)
      target.volume = isMuted ? 0 : 1
      console.log(target.volume)
      setVolume(target.volume);
    };



    videoElement.addEventListener("loadedmetadata", handleLoadedMetadata);

    // Cleanup function to remove the event listener
    return () => {
      videoElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [videoRef]);




  return (


    <div
      ref={containerRef}
      className="main-container absolute inset-0 bg-black overflow-hidden">
      <div className="wrapper-container relative flex w-full h-full justify-center items-center">
        <video
          src="https://videos.pexels.com/video-files/1321208/1321208-uhd_2560_1440_30fps.mp4"
          className="w-full h-full object-cover"
          ref={videoRef}
          onTimeUpdate={(event) => controls.setWidthOfProgressFill(
            progressBarRef.current,
            event.currentTarget,
            setCurrentDuration,
            setCurrentProgressWidth,
            setIsPlaying
          )}
        />
        <div
          className="controller-main-wrappe | absolute bottom-0 left-0 right-0 p-4 w-full bg-gradient-to-t from-black to-transparentr flex flex-col gap-2"
          onMouseLeave={() => setVolumeHover(false)} >
          <div className="progress-bar-wrapper" >
            <div
              ref={progressBarRef}
              className="progress-bar | relative w-full h-1 bg-gray-400 rounded cursor-pointer"
              onClick={(event) => controls.handleSkip(
                event,
                videoRef.current,
                setCurrentDuration,
                setCurrentProgressWidth,
                setIsPlaying,
                false
              )}

              onMouseMove={(event) => controls.handleSkip(
                event,
                videoRef.current,
                setCurrentDuration,
                setHoverProgressWidth,
                setIsHovering,
                true,
              )}
              onMouseLeave={() => {
                setIsHovering(false);
                setHoverProgressWidth(0);
              }}
            >
              {isHovering && (
                <div
                  className="absolute top-0 left-0 h-1 bg-gray-500 transition-all duration-100 ease-in-out opacity-60"
                  style={{ width: hoverProgressWidth }}
                />
              )}
              <div
                className="absolute top-0 left-0 progress-fill | h-1 bg-white rounded z-10 cursor-pointer"
                style={{ width: currentProgressWidth }}
              ></div>
            </div>
          </div>



          <div className="controls relative ">
            <div className="flex justify-between items-center gap-4">

              <div className="flex space-x-4">
                <button onClick={() => controls.handlePlayAndPause(videoRef.current, isPlaying, setIsPlaying, setVideoDuration)}
                  className="text-white hover:text-gray-300">
                  {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                </button>

                <div className="volume flex justify-center items-center gap-2"

                >
                  <button
                    onClick={() => controls.handleMute(videoRef.current, setIsMuted, isMuted, setVolume)}
                    onMouseMove={() => setVolumeHover(true)}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX size={26} color="white" />
                    ) : volume > 0 && volume <= 0.5 ? (
                      <Volume1 size={26} color="white" />
                    ) : (
                      <Volume2 size={26} color="white" />
                    )}
                  </button>
                  {volumeHover && (
                    <input
                      ref={volumeBarRef}
                      type="range"
                      min="0"
                      max="1"
                      step="any"
                      value={volume}
                      onChange={() => controls.handleVolume(volumeBarRef.current, setVolume, videoRef.current)}
                      className="h-1 bg-gray-400 text-gray-300 transition ease-in-out duration-150"
                    />
                  )}
                </div>

                <p className="text-white">{`${currentDuration.toFixed(2)} / ${videoDuration.toFixed(2)}`}</p>
              </div>

              <div className="flex space-x-4">
                <button className="text-white hover:text-gray-300">
                  <Settings size={24} />
                </button>
                <button onClick={() => controls.handleFullScreen(containerRef.current, setIsFullScreen)}
                  className="text-white hover:text-gray-300">
                  {!isFullScreen ? <Maximize size={24} /> : <Minimize size={24} />}
                </button>
              </div>
            </div>
          </div>


        </div>
      </div>
    </div >

  )

}
