import {GameState} from "./GameState";
import {createBox} from "./Box";
import {VIEW_HEIGHT} from "./view";
import * as PIXI from 'pixi.js'
import {Lane} from "./Lane";
import {tick} from "./tick";

export enum AbilityType {
	Lock,
	FastForward,
	Compress,
	Swap,
	Flush,
	Hold
}

export function deactivateAbility(state:GameState) {
	for (let lane of state.lanes) {
		if (lane.lockTurnsLeft === 0) lane.button.showLock();
	}
	for (const slot of state.lanes.flatMap(l => l.slots)) {
		slot.showDefault();
	}
	state.selectedSlot = null;
	state.activeAbility = null;
}

export function activateAbility(state:GameState, ability: AbilityType) {
	if (state.activeAbility === ability) {
		deactivateAbility(state);
		return;
	}
	deactivateAbility(state);
	switch (ability) {
		case AbilityType.FastForward:
			for (const lane of state.lanes) {
				if (lane.lockTurnsLeft === 0) lane.button.showFastForward();
			}
			break;
		case AbilityType.Compress:
			for (const lane of state.lanes) {
				if (lane.lockTurnsLeft === 0) lane.button.showCompress();
			}
			break;
		case AbilityType.Swap:
			for (const slot of state.lanes.flatMap(l => l.slots)) {
				if (slot.crate === null) continue;
				slot.showButton(ability);
			}
			break;
		case AbilityType.Flush:
			for (const slot of state.lanes.flatMap(l => l.slots)) {
				if (slot.crate === null) continue;
				slot.showButton(ability);
			}
			break;
		case AbilityType.Hold:
			for (const lane of state.lanes) {
				if (lane.lockTurnsLeft === 0) lane.button.showLock();
			}
			break;
		default:
			throw new Error('Unreachable.');
	}
	state.activeAbility = ability;
}

export class AbilityBar {
	private readonly abilities: [string, AbilityType][] = [
		["⏩", AbilityType.FastForward],
		["🧲", AbilityType.Compress],
		// ["🏗", AbilityType.Swap],
		["🌊", AbilityType.Flush],
	];
	private readonly buttons: PIXI.Graphics[] = [];
	constructor(private readonly state: GameState) {
		for (let i = 0; i < this.abilities.length; i++) {
			const button = createBox(100, 100, 0xFFFFFF, true);
			button.y = VIEW_HEIGHT - button.height - 40;
			button.x = 200 + (button.width) * i;
			state.app.stage.addChild(button);
			this.buttons.push(button);
		}
		const addText = (i: number, val: string) => {
			const text = new PIXI.Text(val, {fontSize: 52});
			text.anchor.set(0.5, 0.5);
			text.x = this.buttons[i].width / 2;
			text.y = this.buttons[i].height / 2;
			this.buttons[i].addChild(text);
		};
		for (let i = 0; i < this.abilities.length; i++) {
			const[text, ability] = this.abilities[i];
			addText(i, text);
			this.buttons[i].on('click', () => activateAbility(state, ability));
			this.buttons[i].visible = state.configuration.unlockedAbilities.indexOf(ability) !== -1;
		}
	}

	onConfigurationChanged() {
		for (let i = 0; i < this.abilities.length; i++) {
			const[text, ability] = this.abilities[i];
			this.buttons[i].visible = this.state.configuration.unlockedAbilities.indexOf(ability) !== -1;
		}
	}
}
