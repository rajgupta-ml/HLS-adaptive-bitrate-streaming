import { promisify } from 'util';
import { exec } from 'child_process';
import path from 'path';

const execAsync = promisify(exec);

async function checkInputFile(inputPath: string) {
	try {
		const { stdout } = await execAsync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${inputPath}"`);
		console.log(`Input file duration: ${parseFloat(stdout).toFixed(2)} seconds`);
	} catch (error) {
		console.error('Error checking input file:', error);
	}
}

// Usage
const dir = path.join(__dirname, "../../temp/temp");
checkInputFile(dir);
