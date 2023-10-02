import { BoatManager } from "./BoatManager";
import { ActionButton, Lane, LaneButton } from "./Lane";
import * as PIXI from "pixi.js";
import { Configuration } from "./Configuration";
import { AbilityBar, AbilityType } from "./AbilityBar";
import { Slot } from "./Slot";
import { Lighthouse } from "./Root";
import { ScoreDisplay } from "./ScoreDisplay";

export interface GameState {
	scoreDisplay?: ScoreDisplay;
	abilityBar?: AbilityBar;
	app: PIXI.Application;
	actionButtons: ActionButton[];
	lanes: Lane[];
	turn: number;
	score: { value: number };
	lives: { value: number };
	level: { value: number };
	progress: { value: number };
	boatManager?: BoatManager;
	configuration: Configuration;
	selectedSlot: Slot | null;
	activeAbility: AbilityType | null;
	laneAnimations: (() => boolean)[];
	actionAnimations: (() => boolean)[];
	nonBlockingAnimations: (() => boolean)[];
	popupIsActive: boolean;
	lighthouse: Lighthouse;
	onDeath: () => void;
}
