import suksesUrl from '../assets/sukses.mp3'

let pemutar = null

export function bunyiSukses() {
  try {
    if (!pemutar) {
      pemutar = new Audio(suksesUrl)
      pemutar.preload = 'auto'
    }
    pemutar.currentTime = 0
    pemutar.play().catch(() => {})
  } catch {
    /* suara bersifat opsional */
  }
}
