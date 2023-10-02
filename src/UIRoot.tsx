import * as React from 'react'
import styles from "./UIRoot.sass"

export const UIRoot: React.FC<{ text: string, close: () => void }> = ({ text, close }) => {
	return <div className={styles.uiRoot} onClick={close}>
		<div className={styles.letter} onClick={(e) => e.stopPropagation()}>
			{text}
			<div onClick={close}>Okay</div>
		</div>
	</div>
}
