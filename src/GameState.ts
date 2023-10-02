import { BoatManager } from "./BoatManager";
import {ActionButton, Lane, LaneButton} from "./Lane";
import * as PIXI from "pixi.js";
import {Configuration} from "./Configuration";
import {AbilityBar, AbilityType} from "./AbilityBar";
import {Slot} from "./Slot";

export interface GameState {
	abilityBar?: AbilityBar;
	app: PIXI.Application;
	actionButtons: ActionButton[];
	lanes: Lane[];
	turn: number;
	score: { value: number, graphics: PIXI.Text };
	lives: { value: number, graphics: PIXI.Text };
	level: { value: number, graphics: PIXI.Text };
	progress: { value: number, graphics: PIXI.Text };
	boatManager?: BoatManager;
	configuration: Configuration;
	selectedSlot: Slot | null;
	activeAbility: AbilityType | null;
	laneAnimations: (() => boolean)[];
	actionAnimations: (() => boolean)[];
}
