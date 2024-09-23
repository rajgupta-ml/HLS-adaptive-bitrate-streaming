import { ILadder } from "./interface/ILadder.interface";
import { IMetaData } from "./interface/IMetaData.interface";



export function getEncodingLadders(metadata: IMetaData): ILadder[] {
	const ladder = [
		{ resolution: "1920x1080", bitrate: 5000 },
		{ resolution: "1280x720", bitrate: 3000 },
		{ resolution: "854x480", bitrate: 1000 },
		{ resolution: "640x360", bitrate: 500 },
		{ resolution: "256x144", bitrate: 200 }
	];
	return ladder.filter((value) => metadata.width >= Number(value.resolution.split("x")[0]))

} 
