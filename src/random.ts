export function weightedSample<T>(options: [number, T][]): T | null {
	const totalWeight = options.reduce((total, [weight, _]) => total + weight, 0);
	if (totalWeight === 0) {
		return null;
	}
	const randomNumber = Math.random() * totalWeight;
	let upperThreshold = 0;
	for (const [weight, value] of options) {
		if (isNaN(weight)) throw new Error(`'weight' of ${value} is NaN.`);
		upperThreshold += weight;
		if (randomNumber < upperThreshold) {
			return value;
		}
	}

	throw new Error("Unreachable.");
}

export function sample<T>(options: T[]): T | null {
	return options.length === 0
		? null :
		options[randomInt(0, options.length - 1)];
}

export function randomInt(min: number, max: number): number {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}
