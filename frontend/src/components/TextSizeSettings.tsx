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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="text-size-settings-title"
          onClick={handleClose}
        >
          <div
            className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl outline-none dark:bg-gray-900"
            onClick={(event) => event.stopPropagation()}
            ref={panelRef}
            tabIndex={-1}
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2
                  id="text-size-settings-title"
                  className="text-lg font-semibold text-gray-900 dark:text-gray-100"
                >
                  Choose text size
                </h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-full p-1 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:bg-gray-800"
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
                    className={[
                      'w-full rounded-md border px-4 py-3 text-left transition',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                      isSelected
                        ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:border-blue-400 dark:text-blue-300'
                        : 'border-gray-300 text-gray-800 hover:border-blue-400 hover:bg-blue-500/5 dark:border-gray-700 dark:text-gray-100 dark:hover:border-blue-400',
                    ].join(' ')}
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
