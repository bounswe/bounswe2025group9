import { useEffect, useRef, useState } from 'react'
import { GearSix, X } from '@phosphor-icons/react'
import { TEXT_SIZE_OPTIONS, useTextSize } from '../context/TextSizeContext'

const TextSizeSettings = () => {
  const { textSize, setTextSize } = useTextSize()
  const [isOpen, setIsOpen] = useState(false)
  const previouslyFocusedElement = useRef<HTMLElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    if (typeof document !== 'undefined') {
      previouslyFocusedElement.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setIsOpen(false)
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown)
    }

    const focusTimeout = window.setTimeout(() => {
      panelRef.current?.focus()
    }, 0)

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', handleKeyDown)
        window.clearTimeout(focusTimeout)
      }

      previouslyFocusedElement.current?.focus()
    }
  }, [isOpen])

  const handleOpen = () => setIsOpen(true)
  const handleClose = () => setIsOpen(false)

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="flex h-10 w-10 items-center justify-center rounded-md text-current transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 hover:bg-black/10 dark:hover:bg-white/10"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls="text-size-settings-panel"
        aria-label="Open text size settings"
        title="Text size settings"
      >
        <GearSix size={20} weight="bold" />
      </button>

      {isOpen && (
        <div
          id="text-size-settings-panel"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="text-size-settings-title"
          onClick={handleClose}
        >
          <div
            className="w-full max-w-sm rounded-lg p-6 shadow-xl outline-none"
            style={{ backgroundColor: 'var(--color-bg-secondary)' }}
            onClick={(event) => event.stopPropagation()}
            ref={panelRef}
            tabIndex={-1}
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2
                  id="text-size-settings-title"
                  className="text-lg font-semibold"
                  style={{ color: 'var(--color-light)' }}
                >
                  Choose text size
                </h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-full p-1 transition-colors focus:outline-none focus:ring-2"
                style={{
                  color: 'var(--color-gray-400)',
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-gray-800)'
                  e.currentTarget.style.color = 'var(--color-gray-200)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = 'var(--color-gray-400)'
                }}
                aria-label="Close text size settings"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            <div className="space-y-3">
              {TEXT_SIZE_OPTIONS.map(({ id, label }) => {
                const isSelected = id === textSize

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setTextSize(id)
                      handleClose()
                    }}
                    className="w-full rounded-md border px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2"
                    style={{
                      borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-gray-700)',
                      backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                      color: isSelected ? 'var(--color-primary)' : 'var(--color-light)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'var(--color-primary-hover)'
                        e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.05)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'var(--color-gray-700)'
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }
                    }}
                    aria-pressed={isSelected}
                  >
                    <span className="font-medium">{label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default TextSizeSettings
