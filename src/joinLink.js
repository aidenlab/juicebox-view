/**
 * The Join link for a Room: the Page's own address carrying only `?room=`. Every other
 * parameter is dropped, a Snapshot link's `?session=` included, since the Room supersedes it.
 * Unlike the Remote's joinUrl, which keeps them all.
 *
 * @param {string} pageAddress the Page's address, as location.href
 * @param {string} room the room id
 * @returns {string}
 */
export function joinLink(pageAddress, room) {
  const url = new URL(pageAddress)
  url.search = new URLSearchParams({ room }).toString()
  url.hash = ''
  return url.href
}
