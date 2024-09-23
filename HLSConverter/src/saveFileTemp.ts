import * as fs from "fs"


export async function ensureDirOrFile(dir: string, type?: "FILE") {
	try {
		await fs.promises.access(dir);
		if (type === "FILE") return true;
	} catch {
		// Directory does not exist, create it
		if (type === "FILE") return false;
		await fs.promises.mkdir(dir);
	}
}

export async function saveFileTemp(array: ArrayBuffer, dir: string) {
	await ensureDirOrFile(dir);
	await fs.promises.writeFile(`${dir}/temp`, Buffer.from(array))
}
