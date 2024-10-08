import { useRef, useState, useCallback, useEffect } from 'react'
import { Upload, FileVideo, CheckCircle, XIcon, ClipboardIcon, VideoIcon } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import axios, { AxiosProgressEvent } from 'axios'
import { v4 as uuidv4 } from 'uuid'
import { Progress } from './components/ui/progress'
import VideoPlayer from './components/ui/video-player'
import { Button } from './components/ui/button'
interface ProcessingStep {
  name: string;
  status: 'pending' | 'active' | 'completed';
}

export default function VideoUpload() {
  // const BASE_URL = "http://localhost:8080/api/v1"
  // const ws_URI = "ws://localhost:8080"

  const BASE_URL = "http://65.0.76.111/api/v1"
  const ws_URI = "ws://65.0.76.111"
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [loaded, setLoaded] = useState<number>(0)
  const [total, setTotal] = useState<number>(0)
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([
    { name: "Upload Initialized", status: 'pending' },
    { name: "File uploading", status: 'pending' },
    { name: "File uploaded", status: 'pending' },
    { name: "Converting to HLS format", status: 'pending' },
    { name: "Creating Adaptive bitrate streaming", status: 'pending' },
    { name: "Finalizing", status: 'pending' },
    { name: "Process Complete", status: 'pending' }
  ])

  const [openVideo, setOpenVideo] = useState<boolean>(false);
  const [videoUri, setVideoUri] = useState<string>("");
  const [stepCompleted, setStepCompleted] = useState<boolean>(false);
  const getCompletedSteps = () => processingSteps.filter((step) => step.status === "completed").length;
  const updateProcessingStep = useCallback((stepName: string, status: 'pending' | 'active' | 'completed') => {
    setProcessingSteps(prevSteps =>
      prevSteps.map(step =>
        step.name === stepName ? { ...step, status } : step
      )
    )
  }, [])

  const handleCopy = () => {
    navigator.clipboard.writeText(videoUri);
    toast("url is copied to your clipboard")
  }
  const getMetaData = (file: File): Promise<{ width: number, height: number }> => {
    return new Promise(resolve => {
      const videoElement = document.createElement("video")
      const fileURL = URL.createObjectURL(file)
      videoElement.src = fileURL
      videoElement.onloadedmetadata = () => {
        const width = videoElement.videoWidth
        const height = videoElement.videoHeight
        URL.revokeObjectURL(fileURL)
        resolve({ width, height })
      }
    })
  }

  const wsManager = useCallback((uuid: string) => {
    const ws = new WebSocket(ws_URI)

    ws.addEventListener("open", () => {
      ws.send(JSON.stringify({ type: "client", uuid }))
    })

    ws.addEventListener("message", (event) => {
      try {
        const parseData = JSON.parse(event.data)
        console.log(parseData)


        if (parseData.type === "progress") {
          if (parseData.progress < 90) {
            updateProcessingStep("Converting to HLS format", "completed");
            updateProcessingStep("Creating Adaptive bitrate streaming", 'active')
          } else {
            updateProcessingStep("Creating Adaptive bitrate streaming", "completed");
            updateProcessingStep("Finalizing", 'active')
          }
        } else if (parseData.type === "completed") {
          updateProcessingStep("Finalizing", 'completed');
          setTimeout(() => updateProcessingStep("Process Complete", 'completed'), 2000);
          setTimeout(() => setStepCompleted(true), 4000);
        }
      } catch (error) {
        console.error("Failed to parse message data: ", error)
      }
    })
  }, [updateProcessingStep])



  async function getMasterFileUri(formData: FormData) {
    const file = formData.get("fileToUpload");
    let fileName: string | null = null;

    if (file instanceof File) {
      fileName = file.name;
    } else {
      console.error("No valid file found under the key 'fileToUpload'.");
      return; // Exit early if no valid file
    }

    try {
      const response = await axios.post(`${BASE_URL}/get-uri`, { fileName });
      return response.data; // Assuming you want to return the response data
    } catch (error) {
      console.error("Error while getting the master file URI:", error);
      throw error; // Optionally rethrow the error for further handling
    }
  }


  const axiosPostRequest = useCallback(async (formData: FormData) => {
    try {
      updateProcessingStep("Upload Initialized", 'completed');
      updateProcessingStep("File uploading", "active");
      updateProcessingStep("File uploaded", "active");
      const config = {
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          const { loaded, total } = progressEvent
          if (total !== undefined) {
            const newPercentage = Math.floor((loaded / total) * 100)
            setLoaded(Math.floor(loaded / (1024 * 1024)))
            setTotal(Math.floor(total / (1024 * 1024)))
            if (newPercentage === 100) {
              updateProcessingStep("File uploading", 'completed')
              updateProcessingStep("File uploaded", 'completed')
              updateProcessingStep("Converting to HLS format", "active");
            }
          }
        },
        headers: { "Content-Type": "multipart/form-data" }
      }

      await axios.post(`${BASE_URL}/uploadFileToS3`, formData, config)
      toast("File Uploaded Successfully")
    } catch (error) {
      setFile(null)
      if (error instanceof Error) {
        toast(`Upload failed: ${error.message}`)
      } else {
        toast("Unknown error. Developers have been notified.")
      }
    }
  }, [updateProcessingStep])

  const startUpload = useCallback(async () => {
    if (!file) {
      toast("File not selected")
      return
    }

    const uuid = uuidv4()
    const { width, height } = await getMetaData(file)
    const fileExtension = file.name.split(".").pop()
    const name = `${width}x${height}_${uuid}.${fileExtension}`
    const formData = new FormData()
    formData.append("fileToUpload", file, name)

    updateProcessingStep("Upload Initalized", 'active')
    await axiosPostRequest(formData)
    const response = await getMasterFileUri(formData)
    setVideoUri(response.masterFileUri);
    wsManager(uuid)
  }, [file, axiosPostRequest, wsManager, updateProcessingStep])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {

      setFile(selectedFile)
      console.log(file)
      setTotal(Math.floor(selectedFile.size / (1024 * 1024)))
    }

  }
  useEffect(() => {
    // Start upload only if a file has been set
    if (file) {
      startUpload();
    }
  }, [file, startUpload])


  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center mb-6">HLS - adaptive bitrate streaming</h1>
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Upload File</h2>
          <p className="text-gray-600">Upload your video file to generate m3u8 file</p>
        </div>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
            ref={inputRef}
            accept="video/*"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-1 text-sm text-gray-600">Drop your file here or browse</p>
            <p className="text-xs text-gray-500">Max file size 5 GB</p>
          </label>
        </div>
        {file && (
          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Uploads</h3>
            <div className="flex items-center space-x-4">
              <FileVideo className="h-10 w-10 text-blue-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">{file.name}</p>
                <Progress value={(getCompletedSteps() / (processingSteps.length - 1)) * 100} className="mt-2" />
              </div>
            </div>
          </div>
        )}
        {file && (
          <ScrollArea className="h-40 w-full rounded-md border p-4">
            {processingSteps.map((step, index) => (
              <div key={index} className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {step.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {step.status === 'active' && (
                    <div className="h-4 w-4 rounded-full bg-blue-500 animate-pulse"></div>
                  )}
                  {step.status === 'pending' && <div className="h-4 w-4 rounded-full bg-gray-300"></div>}
                  <span className={`text-sm ${step.status === 'active' ? 'font-semibold' : ''}`}>
                    {step.name}
                  </span>
                </div>
                {index === 0 && (
                  <div className="text-xs text-gray-500">
                    ({loaded.toFixed(2)} MB / {total.toFixed(2)} MB)
                  </div>
                )}
              </div>
            ))}
          </ScrollArea>
        )}
      </div>


      {stepCompleted && (
        <div className="flex justify-end items-center mt-5 space-x-2">
          <div className="flex items-center border rounded-md overflow-hidden bg-white">
            <p className="px-3 py-2 text-sm">{videoUri}</p>
            <Button
              size="sm"
              variant="ghost"
              className="hover:bg-gray-100 focus:ring-2 focus:ring-gray-200"
              aria-label="Copy to clipboard"
              onClick={handleCopy}
            >
              <ClipboardIcon size={16} />
            </Button>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="hover:bg-gray-100 focus:ring-2 focus:ring-gray-200"
            aria-label="Open video"
            onClick={() => setOpenVideo(true)} // Added onClick here
          >
            <VideoIcon size={16} />
          </Button>
        </div>
      )}

      {openVideo && (
        <div className="main-container absolute inset-0 flex justify-center items-center aspect-video w-screen h-screen bg-gray-950">
          <button
            type="button"
            className="absolute top-0 right-0 m-4"
            aria-label="Close video"
            onClick={() => setOpenVideo(false)} // Added onClick for better accessibility
          >
            <XIcon size={26} color="white" />
          </button>
          <VideoPlayer videoSrc={videoUri} />
        </div>
      )}


      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div >
  )
}
