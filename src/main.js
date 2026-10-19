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
