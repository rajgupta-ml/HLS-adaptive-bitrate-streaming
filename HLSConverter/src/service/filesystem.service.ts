import * as fs from "fs";

export class fileSystemService {

	async ensureDirOrFile(dir: string, type?: "FILE") {
		try {
			await fs.promises.access(dir);
			if (type === "FILE") return true;
		} catch {
			// Directory does not exist, create it
			if (type === "FILE") return false;
			await fs.promises.mkdir(dir);
		}
	}

	async saveFileTemp(array: ArrayBuffer, dir: string) {
		await this.ensureDirOrFile(dir);
		await fs.promises.writeFile(`${dir}/temp`, Buffer.from(array))
	}


	async dirDelete(dir: string) {
		await fs.promises.rmdir(dir, { recursive: true });
		console.log(`${dir} has been deleted`);
	}

}
