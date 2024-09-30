import { Controls } from "@/lib/controls";
import { hls } from "@/lib/hls";
import { Maximize, Minimize, Play, Pause, Settings, VolumeX, Volume2, Volume1, Check } from "lucide-react";

import { useEffect, useRef, useState } from "react";
export default function VideoPlayer({ videoSrc }: { videoSrc: string }) {
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
  const [levels, setLevels] = useState<string[]>([])
  const [isSettingOpen, setIsSettingOpen] = useState<boolean>(false);
  const [selectedQuality, setSelectedQuality] = useState<string>("auto");
  const hlsInstance = useRef<hls | null>(null);



  useEffect(() => {
    const handleSettingClick = (event: MouseEvent) => {
      if (isSettingOpen &&
        !(event.target as HTMLElement).closest('.QualitySetting') &&
        !(event.target as HTMLElement).closest('#settingBtn')) {
        setIsSettingOpen(false);
      }
    }
    window.addEventListener("click", handleSettingClick)


    return () => {
      window.removeEventListener("click", handleSettingClick)
    }


  }, [isSettingOpen])

  useEffect(() => {
    hlsInstance.current = new hls(videoRef.current, videoSrc); // Initialize hlsInstance
    hlsInstance.current.init();

    return () => {
      // Clean up the instance if necessary
      hlsInstance.current = null;
    };
  }, [videoSrc]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleLoadedMetadata = (event: Event) => {
      const target = event.target as HTMLVideoElement;
      setVideoDuration((target.duration / 60))
      setCurrentDuration((target.currentTime / 60))
      setIsMuted(target.muted)
      target.volume = isMuted ? 0 : 1
      setVolume(target.volume);
      const levels = hlsInstance.current?.getHlsLevels();
      if (!levels) return;
      setLevels(levels);
    };

    videoElement.addEventListener("loadedmetadata", handleLoadedMetadata);

    // Cleanup function to remove the event listener
    return () => {
      videoElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [videoRef]);

  const setQuality = (index: number, level: string) => {
    console.log(index)
    if (!hlsInstance.current) {
      console.error("HLS instance not available");
      return;
    }
    hlsInstance.current.setQuality(index, setSelectedQuality, level);
  };
  return (


    <div
      ref={containerRef}
      className="relative w-[1000px] aspect-video">
      <div className="wrapper-container relative flex w-full h-full justify-center items-end">
        <video
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
        {isSettingOpen && (
          <div className="QualitySetting absolute bottom-16 right-4 w-48 border-white rounded-xl bg-[#323232] bg-opacity-90 py-2 z-10 ">
            {levels.map((level, index) => {
              return (
                <div
                  key={index} // Use the index or a unique identifier if available
                  className="option flex items-center space-x-2 cursor-pointer hover:bg-white px-4 hover:bg-opacity-5 py-2"
                  onClick={() => setQuality(index, level)}
                >
                  <Check size={16} color={selectedQuality !== level ? "transparent" : "white"} /> {/* Adjust as needed */}
                  <h1 className="text-white">{level}</h1> {/* Adjust as needed */}
                </div>
              );
            })}
          </div>
        )}
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

              <div className="flex space-x-4 ">

                <button
                  id="settingBtn"
                  className="text-white hover:text-gray-300"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsSettingOpen(!isSettingOpen)
                  }}
                >
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
