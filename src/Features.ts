export interface Features {
	enableFourthItem: boolean;
	enableJokerCrates: boolean,
	enableJokerCrateBoats: boolean,
	holdForXTurns: number,
	minBoatSize: number,
	maxBoatSize: number,
	jokerCrateChance: number
}

export const createFeatures: () => Features = () => ({
	enableFourthItem: false,
	enableJokerCrates: false,
	enableJokerCrateBoats: false,
	holdForXTurns: 2,
	minBoatSize: 2,
	maxBoatSize: 3,
	jokerCrateChance: 1 / 20,
});
