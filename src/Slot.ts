import {Crate, CRATE_WIDTH, createCrate} from "./Crate";
import {AbilityType} from "./AbilityBar";
import {GameState} from "./GameState";
import * as PIXI from "pixi.js";
import {CranePattern, CraneType} from "./Configuration";
import {tick} from "./tick";
import {animate} from "./animate";
import {laneButtonTexture} from "./Lane";

export const slotTexture = new PIXI.Texture(
	PIXI.Texture.from('assets/track.gif').castToBaseTexture(), new PIXI.Rectangle(
		2*72, 2*48, 2*40, 2*48
	)
);

export const interchangeTexture = new PIXI.Texture(
	PIXI.Texture.from('assets/intercange.gif').castToBaseTexture(), new PIXI.Rectangle(
		150, 136, 52, 108
	)
);

export class Slot {
	private ability: AbilityType | null = null;
	public button?: PIXI.Sprite;

	constructor(
		private readonly gameState: GameState,
		public readonly graphics: PIXI.Sprite,
		public crate: Crate | null = null
	) {
		this.graphics.on('click', () => {
			if (this.ability === null) return;
			if (this.ability === AbilityType.Swap) {
				if (gameState.selectedSlot === null) {
					gameState.selectedSlot = this;
					gameState.activeAbility = null;
					this.showSelected();
					for (let row = 0; row < gameState.lanes.length; row++) {
						const lane = gameState.lanes[row];
						for (let col = 0; col < lane.slots.length; col++) {
							const slot = lane.slots[col];
							if (slot !== this) slot.showDefault();
							const enableSlotIfEmpty = (slot: Slot) => {
								if (slot === this) return;
								if (gameState.configuration.craneType === CraneType.OnlyEmpty) {
									if (slot.crate === null) slot.showButton(AbilityType.Swap);
								} else if (gameState.configuration.craneType === CraneType.Swap) {

								} else throw new Error("Unreachable.");
							}
							if (this.gameState.configuration.cranePattern === CranePattern.Anywhere) {
								enableSlotIfEmpty(slot);
							} else if (this.gameState.configuration.cranePattern === CranePattern.SameLane) {
								for (let i = 1; i < this.gameState.configuration.craneRange + 1; i++) {
									if (
										(row === this.row() && col === this.col() - i)
										|| (row === this.row() && col === this.col() + i)
									) enableSlotIfEmpty(slot);
								}
							} else if (this.gameState.configuration.cranePattern === CranePattern.Cross) {
								for (let i = 1; i < this.gameState.configuration.craneRange + 1; i++) {
									if (
										(row === this.row() && col === this.col() - i)
										|| (row === this.row() && col === this.col() + i)
										|| (row === this.row() - i && col === this.col())
										|| (row === this.row() + i && col === this.col())
									) enableSlotIfEmpty(slot);
								}
							} else throw new Error("Unreachable.");
						}
					}
				} else {
					tick(gameState, {type: "swap", from: gameState.selectedSlot, to: this});
				}
			} else if (this.ability === AbilityType.Flush) {
				tick(gameState, {type: "flush", from: this});
			} else {
				throw new Error("Unsupported ability");
			}
		});
	}

	public col(): number {
		for (let row = 0; row < this.gameState.lanes.length; row++) {
			for (let col = 0; col < this.gameState.lanes[row].slots.length; col++) {
				if (this.gameState.lanes[row].slots[col] === this) return col;
			}
		}
		throw new Error('Unreachable.');
	}

	public row(): number {
		for (let row = 0; row < this.gameState.lanes.length; row++) {
			for (let col = 0; col < this.gameState.lanes[row].slots.length; col++) {
				if (this.gameState.lanes[row].slots[col] === this) return row;
			}
		}
		throw new Error('Unreachable.');
	}

	public showSelected() {
		if (this.crate === null) throw new Error('`crate` is null.');
		this.graphics.interactive = false;
		this.graphics.cursor = "default";
		this.ability = null;
		this.graphics.alpha = 1;
	}

	public showDefault() {
		this.graphics.interactive = false;
		this.graphics.cursor = "default";
		this.ability = null;
		this.graphics.alpha = 1;
	}

	public showButton(ability: AbilityType) {
		this.graphics.interactive = true;
		this.graphics.cursor = "pointer";
		this.ability = ability;
		this.graphics.alpha = 0.7;
	}

	public addCrate(crate: Crate | null) {
		if (this.crate !== null) throw Error("`slot` is not empty.");
		if (crate === null) return;
		this.crate = crate;
		this.gameState.app.stage.addChild(crate.graphics);
		crate.graphics.x = this.cratePosition(crate).x;
		crate.graphics.y = this.cratePosition(crate).y;
	}

	public cratePosition(crate: Crate): { x: number, y: number } {
		return {
			x: Math.floor(this.graphics.getGlobalPosition().x + this.graphics.width / 2),
			y: Math.floor(this.graphics.getGlobalPosition().y + this.graphics.height / 2) - 20
		};
	}

	public pushCrateIntoWater() {
		if (this.crate === null) throw Error("`slot` is empty.");
		this.crate.isDead = true;
		const crate = this.crate;
		crate.fadeAfter = this.cratePosition(crate).x;
		if (crate.lanePath.length > 0) {
			crate.lanePath[crate.lanePath.length - 1].x = this.cratePosition(crate).x + 100;
		} else {
			crate.lanePath.push({x:this.cratePosition(crate).x + 100, y:this.cratePosition(crate).y});
			this.gameState.laneAnimations.push(animateCrate(crate, true));
		}
		this.gameState.laneAnimations.push(() => {
			if (crate.lanePath.length === 0 && crate.actionPath.length === 0) {
				crate.graphics.destroy();
				return false;
			}
			return true;
		})
		this.crate = null;
	}
}


export function moveCrate(gameState: GameState, from: Slot, to: Slot, isLane: boolean) {
	if (to.crate !== null) throw Error("`to` is not empty.");
	if (from.crate === null) return;
	let crate = from.crate;
	to.crate = crate;
	from.crate = null;

	const path = (isLane ? crate.lanePath : crate.actionPath);
	if (path.length === 0) {
		path.push(to.cratePosition(crate));
		(isLane ? gameState.laneAnimations : gameState.actionAnimations).push(animateCrate(crate, isLane));
	} else {
		path[0].x = to.cratePosition(crate).x;
		path[0].y = to.cratePosition(crate).y;
	}
}

export function animateCrate(crate: Crate, isLane: boolean) {
	return () => {
		const path = isLane ? crate.lanePath : crate.actionPath;
		if (path.length > 0) {
			const {x: targetX, y: targetY} = path[0];
			crate.graphics.x += (targetX - crate.graphics.x) / 5;
			crate.graphics.y += (targetY - crate.graphics.y) / 5;
			const epsilon = 10e-3;
			if (
				Math.abs(targetX - crate.graphics.x) < epsilon
				&& Math.abs(crate.graphics.y - targetY) < epsilon
			) {
				path.splice(0, 1);
			}
		}
		if (crate.graphics.x > crate.fadeAfter) {
			crate.graphics.alpha *= 0.90;
		}
		return path.length > 0;
	};
}

export function swapCrate(gameState: GameState, from: Slot, to: Slot) {
	[to.crate, from.crate] = [from.crate, to.crate];
	if (from.crate !== null) {
		from.crate.actionPath.push(from.cratePosition(from.crate));
		gameState.actionAnimations.push(animateCrate(from.crate, false));
	}

	if (to.crate !== null) {
		to.crate.actionPath.push(to.cratePosition(to.crate));
		gameState.actionAnimations.push(animateCrate(to.crate, false));
	}
}
