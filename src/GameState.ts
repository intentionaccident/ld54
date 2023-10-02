import { BoatManager } from "./BoatManager";
import {ActionButton, Lane, LaneButton} from "./Lane";
import * as PIXI from "pixi.js";
import {Features} from "./Features";
import {AbilityType} from "./AbilityBar";
import {Slot} from "./Slot";

export interface GameState {
	app: PIXI.Application;
	actionButtons: ActionButton[];
	lanes: Lane[];
	turn: number;
	score: { value: number, graphics: PIXI.Text };
	lives: { value: number, graphics: PIXI.Text };
	boatManager?: BoatManager;
	features: Features;
	selectedSlot: Slot | null;
	activeAbility: AbilityType | null;
}
