
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { ReactNode } from 'react'
import c from 'classnames';

type ModalProps = {
  children?: ReactNode
  onClose: () => void
  className?: string
}
export default function Modal({ children, onClose, className }: ModalProps) {
  return (
    <div className={c("modalShroud")}>
      <div className={c("modal", className)}>
        <button onClick={onClose} className="modalClose">
          <span className="icon">close</span>
        </button>
        <div className="modalContent">{children}</div>
      </div>
    </div>
  )
}
