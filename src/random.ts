export function weightedSample<T>(options: [number, T][]): T {

	const totalWeight = options.reduce((total, [weight, _]) => total + weight, 0);
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
