import {Boat, BoatLocation, createBoat, getBoatLength, getBoatWidth} from "./Boat";
import {CrateType} from "./Crate";
import {VIEW_HEIGHT, VIEW_WIDTH} from "./view";
import {GameState} from "./GameState";
import {Lane} from "./Lane";

export class BoatManager {
	static readonly BOAT_BUFFER = 6;
	public readonly boats: Boat[] = [];

	constructor(private readonly gameState: GameState) {
		for (let i = 0; i < BoatManager.BOAT_BUFFER; i++) {
			const boat = createBoat(this.gameState.configuration);
			this.boats.push(boat);
		}
	}

	public drawBoatFromDeck(): Boat | null {
		const deckBoat = this.boats.find(boat => boat.location === BoatLocation.Deck)
		if (!deckBoat) {
			return null
		}

		const moor = this.boats.filter(boat => boat.location === BoatLocation.Hand).sort((a, b) => a.moorIndex! - b.moorIndex!)

		let index = 0
		while (moor.length) {
			const mooredBoat = moor.shift()
			if (mooredBoat?.moorIndex !== index) {
				break;
			}
			index++
		}

		deckBoat.location = BoatLocation.Hand;
		deckBoat.moorIndex = index;
		this.gameState.app.stage.addChild(deckBoat.graphics);


		deckBoat.graphics.rotation = Math.PI / 8 * 3
		deckBoat.graphics.x = VIEW_WIDTH - (getBoatLength(deckBoat) * Math.cos(deckBoat.graphics.rotation))
			- deckBoat.moorIndex * (getBoatLength(deckBoat) * Math.cos(deckBoat.graphics.rotation) + getBoatWidth(deckBoat) * Math.sin(deckBoat.graphics.rotation)) - 10;
		const deltaY = (getBoatWidth(deckBoat) * Math.cos(deckBoat.graphics.rotation))
		const initialPosition = (VIEW_HEIGHT) - (getBoatLength(deckBoat) * Math.sin(deckBoat.graphics.rotation)) + deltaY - 10;
		deckBoat.graphics.y = initialPosition
		deckBoat.graphics.on("mouseenter", () => deckBoat.graphics.y -= deltaY)
		deckBoat.graphics.on("mouseleave", () => deckBoat.graphics.y = initialPosition)


		deckBoat.graphics.on("click", () => {
			for (const lane of this.gameState.lanes) {
				lane.addBoatButton.visible = !lane.boat
				lane.addBoatButton.off("click")
				if (!lane.addBoatButton.visible) {
					continue
				}

				lane.addBoatButton.on("click", () => {
					moveBoatToLane(deckBoat, lane)
					lane.boat = deckBoat
					deckBoat.lane = lane
					deckBoat.location = BoatLocation.Lane
					unmoorBoat(deckBoat)

					this.drawBoatFromDeck()

					for (const lane of this.gameState.lanes) {
						lane.addBoatButton.visible = false
						lane.addBoatButton.off("click")
					}
				})
			}
		})
		return deckBoat
	}

	public getUpcomingCratePool(): Record<CrateType, number> {
		let boats = this.visibleBoats().concat(this.upcomingBoats());
		const countCrates = (type: CrateType) => boats.flatMap(b => b.crates).reduce((s, c) => s + (c.type === type ? 1 : 0), 0);
		const pool: Record<CrateType, number> = {
			[CrateType.Circle]: countCrates(CrateType.Circle),
			[CrateType.Triangle]: countCrates(CrateType.Triangle),
			[CrateType.Square]: countCrates(CrateType.Square),
			[CrateType.Cross]: countCrates(CrateType.Cross),
			[CrateType.Joker]: 0,
		};
		return pool;
	}

	public removeBoat(lane: Lane) {
		if (lane.boat === undefined) throw new Error('`lane.boat` is null.');
		this.boats.splice(this.boats.indexOf(lane.boat), 1);
		lane.boat.graphics.destroy();
		delete lane.boat;
		this.boats.push(createBoat(this.gameState.configuration));
	}

	private visibleBoats() {
		return this.boats.filter(b => b.location === BoatLocation.Lane || b.location === BoatLocation.Hand);
	}

	private upcomingBoats() {
		let boats = this.boats.filter(b => b.location === BoatLocation.Deck);
		while (boats.length < this.gameState.configuration.boatLookAheadCount) {
			this.boats.push(createBoat(this.gameState.configuration));
			boats = this.boats.filter(b => b.location === BoatLocation.Deck);
		}
		return boats.slice(0, this.gameState.configuration.boatLookAheadCount);
	}
}

function moveBoatToLane(boat: Boat, lane: Lane) {
	boat.graphics.rotation = 0
	boat.graphics.y = 0
	boat.graphics.x = 500
	lane.graphics.addChild(boat.graphics)
}

function unmoorBoat(boat: Boat) {
	boat.graphics.interactive = false
	boat.graphics.off("mouseenter")
	boat.graphics.off("mouseleave")
}
