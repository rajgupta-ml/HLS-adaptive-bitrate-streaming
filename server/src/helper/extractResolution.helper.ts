export function extractInformation(url: string): { width: string, height: string, uuid: string } | null {
	const regex = /(\d+)x(\d+)_(.*)\.mp4/; // Capture width, height, and UUID
	const match = url.match(regex);

	if (match) {
		const width = match[1];     // Width
		const height = match[2];    // Height
		const uuid = match[3];       // UUID
		return { width, height, uuid }; // Return as an object
	}

	return null; // Return null if no match found
}
