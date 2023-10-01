import { Boat, BoatLocation, createBoat, getBoatLength, getBoatWidth } from "./Boat";
import * as PIXI from "pixi.js";
import { CrateType, CrateTypes } from "./Crate";
import { VIEW_WIDTH, VIEW_HEIGHT } from "./view";
import { GameState } from "./GameState";
import { Lane } from "./Lane";

export class BoatManager {
	static readonly BOAT_BUFFER = 6;
	public readonly boats: Boat[] = [];
	constructor(private readonly gameState: GameState) {
		for (let i = 0; i < BoatManager.BOAT_BUFFER; i++) {
			const boat = createBoat(3);
			this.boats.push(boat);
		}
	}

	public drawBoat(): Boat | null {
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
			- deckBoat.moorIndex * (getBoatLength(deckBoat) * Math.cos(deckBoat.graphics.rotation) + getBoatWidth(deckBoat) * Math.sin(deckBoat.graphics.rotation));
		const deltaY = (getBoatWidth(deckBoat) * Math.cos(deckBoat.graphics.rotation))
		const initialPosition = (VIEW_HEIGHT) - (getBoatLength(deckBoat) * Math.sin(deckBoat.graphics.rotation)) + deltaY;
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

					this.drawBoat()

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
		return this.boats.map(
			boat => boat.crates
				.reduce(
					(total, next) => (total[next.type] ??= 0,
						total[next.type]++,
						total
					),
					{} as Record<CrateType, number>
				)
		).reduce(
			(total, next) => {
				for (const [key, value] of Object.entries(next)) {
					total[key as any as CrateType] += value;
				}
				return total;
			},
			CrateTypes.reduce((total, next) => (total[next] = 1, total), {} as Record<CrateType, number>)
		);
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

