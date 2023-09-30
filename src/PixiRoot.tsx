import { Application, Texture, Sprite } from "pixi.js";
import { useRef, useEffect } from "react";
import * as React from "react";
import * as PIXI from 'pixi.js'

export const PixiRoot = (props: {app: PIXI.Application}) => {
	const ref: React.MutableRefObject<HTMLDivElement | null> = useRef(null);
	useEffect(() => {
		if (ref.current === null) throw new Error("Unreachable.");
		ref.current.appendChild(props.app.view as HTMLCanvasElement);
	}, [ref]);
	return <div ref={ref} />;
}
