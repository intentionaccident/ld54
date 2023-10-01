export interface Features {
	enableJokerCrates: boolean,
	enableJokerCrateBoats: boolean,
	holdForXTurns: number,
	minBoatSize: number,
	maxBoatSize: number,
	jokerCrateChance: number
}

export const createFeatures: () => Features = () => ({
	enableJokerCrates: true,
	enableJokerCrateBoats: true,
	holdForXTurns: 2,
	minBoatSize: 2,
	maxBoatSize: 3,
	jokerCrateChance: 1 / 20,
});
