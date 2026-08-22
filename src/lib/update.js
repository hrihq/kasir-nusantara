import pkg from '../../package.json'

export const VERSI = pkg.version

const GITHUB_REPO = 'hrihq/kasir-nusantara'

const bandingkanVersi = (a, b) => {
  const pa = String(a).split('.').map(Number)
  const pb = String(b).split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) > (pb[i] || 0) ? 1 : -1
  }
  return 0
}

export async function cekPembaruan() {
  if (!GITHUB_REPO || GITHUB_REPO.includes('USERNAME')) return null
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' },
    })
    if (!res.ok) return null
    const data = await res.json()
    const versi = String(data.tag_name || '').replace(/^v/i, '')
    if (!versi || bandingkanVersi(versi, VERSI) <= 0) return null
    const apk = (data.assets || []).find((a) => a.name.toLowerCase().endsWith('.apk'))
    return {
      versi,
      catatan: data.body || '',
      urlUnduh: apk ? apk.browser_download_url : data.html_url,
    }
  } catch {
    return null
  }
}
