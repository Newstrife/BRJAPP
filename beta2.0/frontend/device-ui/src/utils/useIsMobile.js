import { ref, onMounted, onBeforeUnmount } from 'vue'

export const useIsMobile = (breakpoint = 768) => {
  const isMobile = ref(
    typeof window !== 'undefined' && window.matchMedia(`(max-width: ${breakpoint}px)`).matches
  )

  const media = window.matchMedia(`(max-width: ${breakpoint}px)`)
  const update = event => {
    isMobile.value = event.matches
  }

  onMounted(() => media.addEventListener('change', update))
  onBeforeUnmount(() => media.removeEventListener('change', update))

  return isMobile
}
