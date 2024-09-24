import 'react-toastify/dist/ReactToastify.css';
import "./css/app.css"
import axios, { AxiosError, AxiosProgressEvent } from "axios"
import uploadIcon from "./assets/upload-icon.png";
import { useRef, useState } from "react";
import { UploadFileContent } from "./componets/UploadedFile.componet";
import { toast, ToastContainer } from "react-toastify";
import { v4 as uuidv4 } from "uuid"
function App() {
  const BASE_URL = "http://localhost:8080/api/v1"
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [percentage, setPercentage] = useState<number>(0);
  const [fileUploaded, setFileUploaded] = useState<File | null>(null);
  const [loaded, setLoaded] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);

  function getMetaData(file: File): Promise<{ width: number, height: number }> {

    return new Promise(resolve => {
      const videoElement = document.createElement("video");
      const fileURL = URL.createObjectURL(file);

      videoElement.src = fileURL;
      videoElement.onloadedmetadata = () => {
        const width = videoElement.videoWidth;
        const height = videoElement.videoHeight;
        URL.revokeObjectURL(fileURL);
        resolve({ width, height });
      }

    })


  }
  async function axiosPostRequest(formData: FormData) {
    console.log(formData)
    try {

      const config = {
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          const { loaded, total } = progressEvent;
          if (!total) return;
          const newPercentage = Math.floor((loaded / total) * 100);
          setLoaded(Math.floor(loaded / (8 * 1024 * 1024)));
          setTotal(Math.floor(total / (8 * 1024 * 1024)))
          setPercentage(newPercentage);
        },
        headers: {
          "Content-Type": "multipart/form-data"
        }
      }

      await axios.post(`${BASE_URL}/uploadFileToS3`, formData, config);

      setTimeout(() => {
        setPercentage(0);
      }, 1000)

      toast("File Uploaded Successfully")

    } catch (error) {
      setFileUploaded(null)
      if (error instanceof AxiosError) {
        toast("Try after sometime")
        return;
      }

      toast("Unknown error developers have been notified")
    }


  }
  async function startUpload() {
    //Use toastify to return a toast for the error
    if (!inputRef.current?.files || inputRef.current.files.length === 0) {
      toast("File not selected")
      return
    }
    const selectedFile = inputRef.current.files[0];
    setFileUploaded(selectedFile);
    const { width, height } = await getMetaData(selectedFile)
    const fileExtension = selectedFile.name.split(".").pop();
    const name = `${width}x${height}_${uuidv4()}.${fileExtension}`;
    const formData = new FormData();
    formData.append("fileToUpload", selectedFile, name);
    await axiosPostRequest(formData);
  }

  return (


    <>

      <div className="main-container">
        <h1 className="heading">HLS - adaptive bitrate streaming</h1>

        <div className="upload-main-container">
          <div className="heading-container">
            <h2 className="upload-file-heading">Upload File</h2>
            <p className="upload-file-para">Upload your video file to generate m3u8 file </p>
          </div>

          <div className="upload-inner-container">
            <div className="upload-files-dropzone" onClick={() => inputRef.current?.click()}>
              <input type="file" className="upload-file-input" ref={inputRef} onChange={startUpload} accept="video/*" />
              <img src={uploadIcon} className="custom-upload-button" />

              <div className="upload-content-section">
                <h3>Drop your file here or browse</h3>
                <span>Max file size 5 GB</span>

              </div>
            </div>
            {fileUploaded && (
              <div className="uploaded-section">
                <h3 className="uploaded-heading">Uploads</h3>
                <div className="uploaded-files-container">

                  <UploadFileContent percentage={percentage} loaded={loaded} total={total} extension={fileUploaded.type} name={fileUploaded.name} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div >
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
        theme="light" />

    </>
  )
}

export default App
