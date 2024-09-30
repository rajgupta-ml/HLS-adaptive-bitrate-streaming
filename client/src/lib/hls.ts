import Hls from "hls.js"

type ISetState<T> = React.Dispatch<React.SetStateAction<T>>;

export class hls {
  private videoRef: HTMLVideoElement | null;
  private src: string;
  private hlsInstance?: Hls;
  constructor(videoRef: HTMLVideoElement | null, videoSrc: string) {
    this.videoRef = videoRef;
    this.src = videoSrc;

  }

  init() {
    if (!this.videoRef || !this.src) {
      console.error("HLS cannot be initialized");
      return
    }
    console.log(this.src)
    if (Hls.isSupported()) {
      this.hlsInstance = new Hls();
      this.hlsInstance.loadSource(this.src);
      this.hlsInstance.attachMedia(this.videoRef);
    } else if (this.videoRef.canPlayType('application/vnd.apple.mpegurl')) {
      this.videoRef.src = this.src
    }

  }


  getHlsLevels(): string[] {
    const options = ["auto"];
    if (!this.hlsInstance) {
      console.error("No video Available");
      return options;
    }

    this.hlsInstance.levels.forEach((values, index) => {
      const height = (values.height).toString()
      options[index + 1] = height
    });
    console.log(options)

    return options
  }


  setQuality(index: number, setQuality: ISetState<string>, key: string) {
    if (!this.hlsInstance) {
      console.error("No video Available");
      return;
    }
    const newIndex = index - 1;
    this.hlsInstance.currentLevel = newIndex;
    setQuality(key);

  }

}
