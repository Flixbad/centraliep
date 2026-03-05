import { useState } from 'react'
import styles from './ConfirmDialog.module.css'

export function ConfirmDialog({
  open,
  title = 'Confirmation',
  message = 'Êtes-vous sûr ?',
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  onConfirm,
  onCancel,
  danger = true,
}) {
  if (!open) return null

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <button type="button" className={styles.btnCancel} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={danger ? styles.btnConfirmDanger : styles.btnConfirm}
            onClick={() => {
              onConfirm?.()
              onCancel?.()
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
