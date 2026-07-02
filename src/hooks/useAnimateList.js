import { useAutoAnimate } from '@formkit/auto-animate/react'

export function useAnimateList(options) {
  const [parent] = useAutoAnimate(options)
  return parent
}
