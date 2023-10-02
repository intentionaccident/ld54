import {Boat, BoatLocation, createBoat, getBoatLength, getBoatWidth} from "./Boat";
import {CrateType} from "./Crate";
import {VIEW_HEIGHT, VIEW_WIDTH} from "./view";
import {GameState} from "./GameState";
import {Lane} from "./Lane";
import {slotTexture} from "./Slot";
import * as PIXI from "pixi.js";

export class BoatManager {
	static readonly BOAT_BUFFER = 6;
	public boats: Boat[] = [];
	private readonly handContainer: PIXI.Container = new PIXI.Container;

	constructor(private readonly gameState: GameState) {
		gameState.app.stage.addChild(this.handContainer);
		this.handContainer.sortableChildren = true;
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
		deckBoat.manifestGraphics.zIndex = index;
		this.handContainer.addChild(deckBoat.manifestGraphics);


		deckBoat.manifestGraphics.x = 900 + index * 120;
		const deltaY = 50;
		const initialPosition = VIEW_HEIGHT - deckBoat.manifestGraphics.height + deltaY;
		deckBoat.manifestGraphics.y = initialPosition;
		deckBoat.manifestGraphics.on("mouseenter", () => deckBoat.manifestGraphics.y = initialPosition - deltaY)
		deckBoat.manifestGraphics.on("mouseleave", () => deckBoat.manifestGraphics.y = initialPosition)


		deckBoat.manifestGraphics.on("click", () => {
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
		lane.boat.manifestGraphics.destroy();
		lane.boat.boatGraphics.destroy();
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

	public reset() {
		for (const lane of this.gameState.lanes) {
			if (lane.boat !== undefined) this.removeBoat(lane);
		}
		const count = this.boats.length;
		while (this.boats.length > 0) {
			let boat = this.boats.pop()!;
			boat.boatGraphics.destroy();
			boat.manifestGraphics.destroy();
		}
		for (let i = 0; i < count; i++) {
			this.boats.push(createBoat(this.gameState.configuration))
		}
		this.drawBoatFromDeck();
		this.drawBoatFromDeck();
		for (const lane of this.gameState.lanes) {
			lane.addBoatButton.visible = false
			lane.addBoatButton.off("click")
		}
	}
}

export function moveBoatToLane(boat: Boat, lane: Lane) {
	boat.boatGraphics.pivot.set(0, -boat.boatGraphics.height/2);
	boat.boatGraphics.y = -120;
	boat.boatGraphics.x = lane.addBoatButton.x;
	lane.graphics.addChild(boat.boatGraphics);
}

function unmoorBoat(boat: Boat) {
	boat.manifestGraphics.visible = false;
	boat.manifestGraphics.off("mouseenter")
	boat.manifestGraphics.off("mouseleave")
}
