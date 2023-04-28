import { Application, Texture, Sprite } from "pixi.js";
import { useRef, useEffect } from "react";
import * as React from "react";
import * as PIXI from 'pixi.js'

export const PixiRoot = (props: {app: PIXI.Application}) => {
	const ref = useRef(null);
	useEffect(() => {
		ref.current.appendChild(props.app.view);
	}, [ref]);
	return <div ref={ref} />;
}
