import * as React from 'react'
import styles from "./UIRoot.sass"

export const UIRoot: React.FC<{
	text: string
	close: () => void
	reload: boolean
}> = ({ text, close, reload }) => {
	return <div className={styles.uiRoot} onClick={() => reload ? window.location = window.location : close()}>
		<div className={styles.letter} onClick={(e) => e.stopPropagation()}>
			<div>
				Esteemed Harbour Master,
			</div>
			<div>
				{text}
			</div>
			<div className={styles.signature}>
				Regards,
				<br />
				Port Authority
			</div>
		</div>
	</div>
}
