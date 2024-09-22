import deleteIcon from "../assets/delete.png"
import crossIcon from "../assets/cross.png"


interface IProps {
  percentage: number;
  loaded: number;
  total: number;
  extension: string,
  name: string,
}

export const UploadFileContent = ({ percentage, loaded, total, extension, name }: IProps) => {

  return (
    <>
      <div className="main-wrapper">

        <div className="file-container">

          <div className="left-section">
            <p className="avatar">{extension.toUpperCase().split("/")[1]}</p>
            <div className="product-content">
              <h4 className="file-heading">{name.length > 15 ? `${name.slice(0, 14)}...` : name}</h4>
              <h6 className="file-size">{`${loaded} MB of ${total} MB`}</h6>
            </div>

          </div>
          <img src={percentage > 0 ? crossIcon : deleteIcon} className="delete-icon" />

        </div>

        {percentage > 0 && <progress value={percentage} max={100} className="progress-bar"></progress>}
      </div>

    </>

  )
}  
