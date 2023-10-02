import {GameState} from "./GameState";

export function animate(gameState: GameState) {
	if (gameState.popupIsActive) return;

	if (gameState.nonBlockingAnimations.length > 0) {
		animateNonBlockingAnimations(gameState);
	}

	if (gameState.actionAnimations.length > 0) {
		animateActions(gameState);
		return;
	}

	if (gameState.laneAnimations.length > 0) {
		animateLanes(gameState);
		return;
	}
}

function animateLanes(gameState: GameState) {
	for (let i = gameState.laneAnimations.length - 1; i >= 0; i--) {
		if (!gameState.laneAnimations[i]()) {
			gameState.laneAnimations.splice(i, 1);
		}
	}
}

function animateActions(gameState: GameState) {
	for (let i = gameState.actionAnimations.length - 1; i >= 0; i--) {
		if (!gameState.actionAnimations[i]()) {
			gameState.actionAnimations.splice(i, 1);
		}
	}
}

function animateNonBlockingAnimations(gameState: GameState) {
	for (let i = gameState.nonBlockingAnimations.length - 1; i >= 0; i--) {
		if (!gameState.nonBlockingAnimations[i]()) {
			gameState.nonBlockingAnimations.splice(i, 1);
		}
	}
}
