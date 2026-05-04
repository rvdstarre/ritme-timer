import pkg from 'electron-updater'
const { autoUpdater } = pkg
import { ipcMain, shell } from 'electron'
import { readFileSync } from 'fs'
import { join } from 'path'

const RELEASES_REPO = 'rvdstarre/ritme-timer-releases'
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000 // 6 uur

// Linux: alleen AppImage ondersteunt electron-updater
const isAppImage = process.platform === 'linux' && !!process.env.APPIMAGE
const isLinuxManual = process.platform === 'linux' && !isAppImage
const isMac = process.platform === 'darwin'

function send(channel, data) {
  global.mainWindow?.webContents.send(channel, data)
}

// ── Changelog ophalen ─────────────────────────────────────────────

async function fetchChangelogFromGitHub(version) {
  try {
    const tag = `v${version}`
    const url = `https://api.github.com/repos/${RELEASES_REPO}/releases/tags/${tag}`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Ritme-Timer-App' }
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return data.body ?? ''
  } catch {
    return null
  }
}

function readChangelogFromBundle(version) {
  try {
    // In productie: CHANGELOG.md zit naast de app-resources
    const candidates = [
      join(process.resourcesPath ?? '', '..', 'CHANGELOG.md'),
      join(__dirname, '../../CHANGELOG.md')
    ]
    for (const path of candidates) {
      try {
        const content = readFileSync(path, 'utf-8')
        const match = content.match(
          new RegExp(`## \\[${version.replace('.', '\\.')}\\][^\\n]*\\n([\\s\\S]*?)(?=\\n## \\[|\\z)`)
        )
        if (match) return match[1].trim()
      } catch { /* volgende proberen */ }
    }
  } catch { /* geen fallback beschikbaar */ }
  return ''
}

async function getChangelog(version) {
  const remote = await fetchChangelogFromGitHub(version)
  if (remote) return remote
  return readChangelogFromBundle(version)
}

// ── GitHub API check (voor Linux .deb/.rpm) ───────────────────────

async function checkLatestOnGitHub() {
  const url = `https://api.github.com/repos/${RELEASES_REPO}/releases/latest`
  const res = await fetch(url, { headers: { 'User-Agent': 'Ritme-Timer-App' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

function newerThan(remote, current) {
  const toNum = v => v.replace(/^v/, '').split('.').map(Number)
  const r = toNum(remote)
  const c = toNum(current)
  for (let i = 0; i < 3; i++) {
    if ((r[i] ?? 0) > (c[i] ?? 0)) return true
    if ((r[i] ?? 0) < (c[i] ?? 0)) return false
  }
  return false
}

async function checkLinuxManual() {
  try {
    const { app } = await import('electron')
    const current = app.getVersion()
    const release = await checkLatestOnGitHub()
    const remoteVersion = release.tag_name.replace(/^v/, '')

    if (!newerThan(remoteVersion, current)) return

    const changelog = release.body ?? await getChangelog(remoteVersion)
    const downloadUrl = release.html_url

    send('update-available', {
      version: remoteVersion,
      changelog,
      manual: true,
      downloadUrl
    })
  } catch { /* stilzwijgend negeren — geen internet of API-fout */ }
}

// ── electron-updater setup (Windows / macOS / AppImage) ───────────

function setupAutoUpdater() {
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = false
  autoUpdater.logger = null // logging via IPC naar renderer

  autoUpdater.on('update-available', async (info) => {
    const changelog = await getChangelog(info.version)
    send('update-available', {
      version: info.version,
      changelog,
      manual: false
    })
  })

  autoUpdater.on('download-progress', (progress) => {
    send('update-progress', {
      percent: Math.round(progress.percent),
      transferred: progress.transferred,
      total: progress.total
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    send('update-ready', { version: info.version })
  })

  autoUpdater.on('error', () => {
    // Stilzwijgend negeren — update is een bonus, geen vereiste
  })
}

// ── IPC handlers ──────────────────────────────────────────────────

function registerUpdateHandlers() {
  ipcMain.handle('install-update', () => {
    if (!isLinuxManual) {
      autoUpdater.quitAndInstall(false, true)
    }
  })

  ipcMain.handle('open-download-url', (_e, url) => {
    shell.openExternal(url)
  })
}

// ── Publieke API ──────────────────────────────────────────────────

export function setupUpdater() {
  registerUpdateHandlers()

  if (isLinuxManual) {
    // .deb/.rpm: handmatige GitHub API check
    checkLinuxManual()
    setInterval(checkLinuxManual, CHECK_INTERVAL_MS)
  } else {
    // Windows / macOS / AppImage: electron-updater
    setupAutoUpdater()
    autoUpdater.checkForUpdates().catch(() => {})
    setInterval(() => autoUpdater.checkForUpdates().catch(() => {}), CHECK_INTERVAL_MS)
  }
}
