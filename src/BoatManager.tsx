import {Boat, BoatLocation, createBoat, getBoatLength, getBoatWidth} from "./Boat";
import {CrateType} from "./Crate";
import {VIEW_HEIGHT, VIEW_WIDTH} from "./view";
import {GameState} from "./GameState";
import {Lane} from "./Lane";
import {slotTexture} from "./Slot";
import * as PIXI from "pixi.js";
import {Simulate} from "react-dom/test-utils";
import stalled = Simulate.stalled;
import {paperSound} from "./sounds";

export const deckTextures = [
	PIXI.Texture.from('assets/deck1.png'),
	PIXI.Texture.from('assets/deck2.png'),
	PIXI.Texture.from('assets/deck3.png'),
];

export class BoatManager {
	public boats: Boat[] = [];
	private readonly handContainer: PIXI.Container = new PIXI.Container;
	private readonly deckGraphics: PIXI.Container;

	constructor(private readonly gameState: GameState) {
		gameState.app.stage.addChild(this.handContainer);
		this.handContainer.sortableChildren = true;
		for (let i = 0; i < gameState.configuration.shipsNeeded; i++) {
			const boat = createBoat(this.gameState.configuration);
			this.boats.push(boat);
		}
		this.deckGraphics = new PIXI.Container();
		this.deckGraphics.x -= 80;
		for (let i = 0; i < 3; i++) {
			const deckSprite = new PIXI.Sprite(deckTextures[i]);
			this.deckGraphics.addChild(deckSprite);
		}
		this.handContainer.addChild(this.deckGraphics);
	}

	public setHandContainerZIndex(i: number) {
		this.gameState.app.stage.setChildIndex(this.handContainer, i);
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
					paperSound.play()
				})
			}
		})
		this.updateDeckGraphics();
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

	public removeBoat(lane: Lane, shouldDestroy = true) {
		if (lane.boat === undefined) throw new Error('`lane.boat` is null.');
		this.boats.splice(this.boats.indexOf(lane.boat), 1);
		if (shouldDestroy) {
			lane.boat.manifestGraphics.destroy();
			lane.boat.boatGraphics.destroy();
		}
		delete lane.boat;
	}

	private visibleBoats() {
		return this.boats.filter(b => b.location === BoatLocation.Lane || b.location === BoatLocation.Hand);
	}

	private upcomingBoats() {
		let boats = this.boats.filter(b => b.location === BoatLocation.Deck);
		return boats.slice(0, this.gameState.configuration.boatLookAheadCount);
	}

	public reset() {
		for (const lane of this.gameState.lanes) {
			if (lane.boat !== undefined) this.removeBoat(lane);
		}
		while (this.boats.length > 0) {
			let boat = this.boats.pop()!;
			boat.boatGraphics.destroy();
			boat.manifestGraphics.destroy();
		}
		for (let i = 0; i < this.gameState.configuration.shipsNeeded; i++) {
			this.boats.push(createBoat(this.gameState.configuration))
		}
		this.drawBoatFromDeck();
		this.drawBoatFromDeck();
		for (const lane of this.gameState.lanes) {
			lane.addBoatButton.visible = false
			lane.addBoatButton.off("click")
		}
	}

	public updateDeckGraphics() {
		for (let i = 0; i < this.deckGraphics.children.length; i++) {
			this.deckGraphics.children[i].visible = false;
		}
		let shipsInDeck = this.boats.filter(b => b.location === BoatLocation.Deck).length;
		let progress = shipsInDeck / (this.gameState.configuration.shipsNeeded - 2);
		console.log(progress)
		if (shipsInDeck !== 0) {
			if (progress >= .66) {
				this.deckGraphics.children[2].visible = true;
			} else if (progress >= .33) {
				this.deckGraphics.children[1].visible = true;
			} else {
				this.deckGraphics.children[0].visible = true;
			}
		}
	}
}

export function moveBoatToLane(boat: Boat, lane: Lane) {
	boat.boatGraphics.pivot.set(0, -boat.boatGraphics.height/2);
	boat.boatGraphics.y = -100;
	boat.boatGraphics.x = lane.addBoatButton.x;
	lane.graphics.addChild(boat.boatGraphics);
}

function unmoorBoat(boat: Boat) {
	boat.manifestGraphics.visible = false;
	boat.manifestGraphics.off("mouseenter")
	boat.manifestGraphics.off("mouseleave")
}
