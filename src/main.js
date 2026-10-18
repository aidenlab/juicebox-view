import juicebox from 'juicebox.js'
import 'juicebox.js/dist/css/juicebox.css'
// juicebox.js draws its Panel's icons with Font Awesome 4 and leaves the font to the Page.
import 'font-awesome/css/font-awesome.css'
import './styles/page.scss'
import { attachRemote } from '@aidenlab/juicebox-remote'
import { createHeader, showRoom, showToolCall } from './header.js'
import { followRoom } from './roomStatus.js'

const page = document.querySelector('.page')
const panelsElement = document.querySelector('.page__panels')

const header = createHeader()
page.prepend(header)

// A Join link's Page is connecting from the start, not in no Room while juicebox.js starts.
const room = new URLSearchParams(location.search).get('room')
const roomStatus = followRoom(location.href)
if (room) showRoom(header, roomStatus('connecting', undefined))

// ENCODE and the other challenged hosts are read through the dev server's proxy.
// Imported only in dev, so a production build never resolves it.
if (import.meta.env.DEV) {
  const { devMapUrl } = await import('juicebox.js/dev-proxy/map-url')
  juicebox.setUrlMapper(devMapUrl)
}

// juicebox.css 4.11.0 gives .hic-root a 3px border and a 4px margin on every side.
const PANEL_FRAME = 2 * (3 + 4)

// The smallest contact map the Page asks for, however little room the window leaves.
const MIN_MAP_SIZE = 100

/**
 * A juicebox.js length from its stylesheet's custom properties, in pixels.
 *
 * @param {string} name
 * @returns {number}
 */
function juiceboxLength(name) {
  return parseInt(getComputedStyle(document.documentElement).getPropertyValue(name))
}

/**
 * Sizes every Panel's contact map so that one Panel fits the space juicebox.js is given:
 * that space less what juicebox.js draws around the map. It is set on the document rather
 * than in the Panel's config, so that a restored Snapshot link, whose config replaces
 * the Page's, is sized the same.
 */
function sizePanels() {
  const scrollbar = juiceboxLength('--hic-scrollbar-height')
  const axis = juiceboxLength('--hic-axis-height')
  const navBar = 2 * (juiceboxLength('--nav-bar-label-height') + juiceboxLength('--nav-bar-widget-container-height') + 2 * juiceboxLength('--nav-bar-widget-container-margin'))

  const { clientWidth, clientHeight } = panelsElement
  const width = Math.max(clientWidth - scrollbar - axis - PANEL_FRAME, MIN_MAP_SIZE)
  const height = Math.max(clientHeight - scrollbar - axis - navBar - PANEL_FRAME, MIN_MAP_SIZE)

  document.documentElement.style.setProperty('--hic-viewport-width', `${width}px`)
  document.documentElement.style.setProperty('--hic-viewport-height', `${height}px`)
}

sizePanels()

// juicebox.js reads a Snapshot link's ?session= itself; with none, it shows one empty Panel.
// The config is empty because juicebox-mcp's tools need nothing in it: each Panel takes its
// genome from the map it loads, and a gene name in a locus is looked up by that genome.
await juicebox.init(panelsElement, {})

// A Join link joins its Room; after juicebox.init, so that a Snapshot link opened with it only
// seeds an empty Room. With no ?room= the Page attaches no Remote.
if (room) {
  const remote = attachRemote({
    hic: juicebox,
    container: panelsElement,
    url: import.meta.env.VITE_WS_URL,
    room,
    onStatus: (status) => showRoom(header, roomStatus(status, remote.room)),
    onToolCall: (name) => showToolCall(header, name),
  })
}
