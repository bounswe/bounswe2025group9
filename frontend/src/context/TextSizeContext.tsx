import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type TextSize = 'small' | 'normal' | 'big' | 'huge'

type TextSizeContextValue = {
  textSize: TextSize
  setTextSize: (size: TextSize) => void
}

const STORAGE_KEY = 'text-size-preference'

const TEXT_SIZE_PERCENT: Record<TextSize, number> = {
  small: 90,
  normal: 100,
  big: 115,
  huge: 130,
}

const TextSizeContext = createContext<TextSizeContextValue | undefined>(
  undefined,
)

const isTextSize = (value: string | null): value is TextSize => {
  return value === 'small' || value === 'normal' || value === 'big' || value === 'huge'
}

const applyTextSizeToDocument = (size: TextSize) => {
  if (typeof document === 'undefined') {
    return
  }

  const percent = TEXT_SIZE_PERCENT[size]
  document.documentElement.style.setProperty('font-size', `${percent}%`)
}

const readInitialTextSize = (): TextSize => {
  if (typeof window === 'undefined') {
    return 'normal'
  }

  const storedValue = window.localStorage.getItem(STORAGE_KEY)
  if (isTextSize(storedValue)) {
    return storedValue
  }

  return 'normal'
}

type TextSizeProviderProps = {
  children: ReactNode
}

export const TextSizeProvider = ({ children }: TextSizeProviderProps) => {
  const [textSize, setTextSizeState] = useState<TextSize>(readInitialTextSize)

  useEffect(() => {
    applyTextSizeToDocument(textSize)

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, textSize)
    }
  }, [textSize])

  const setTextSize = useCallback((size: TextSize) => {
    setTextSizeState(size)
  }, [])

  const value = useMemo<TextSizeContextValue>(
    () => ({
      textSize,
      setTextSize,
    }),
    [textSize, setTextSize],
  )

  return (
    <TextSizeContext.Provider value={value}>
      {children}
    </TextSizeContext.Provider>
  )
}

export const useTextSize = () => {
  const context = useContext(TextSizeContext)

  if (context === undefined) {
    throw new Error('useTextSize must be used within a TextSizeProvider')
  }

  return context
}

export const TEXT_SIZE_OPTIONS: { id: TextSize; label: string }[] = [
  { id: 'small', label: 'Small' },
  { id: 'normal', label: 'Normal' },
  { id: 'big', label: 'Big' },
  { id: 'huge', label: 'Huge' },
]

