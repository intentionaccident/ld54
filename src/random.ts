export function weightedSample<T>(options: [number, T][]): T | null {

	const totalWeight = options.reduce((total, [weight, _]) => total + weight, 0);
	if (totalWeight === 0) {
		return null;
	}
	const randomNumber = Math.random() * totalWeight;
	let upperThreshold = 0;
	for (const [weight, value] of options) {
		upperThreshold += weight;
		if (randomNumber < upperThreshold) {
			return value;
		}
	}

	throw new Error("Unreachable.");
}

export function randomInt(min: number, max: number): number {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}
