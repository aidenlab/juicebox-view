# juicebox-view

A thin web page that houses juicebox.js and joins a juicebox-mcp Room, so a model can drive Hi-C contact maps beside a conversation while a person works on them by hand. Terms shared with juicebox-mcp mean what its glossary says; they are repeated here only as far as this repo uses them.

## Language

### The page

**Page**:
One web-browser tab hosting juicebox.js. This repo builds one kind of Page.
_Avoid_: viewer, app, embed, client, host (juicebox-mcp's word for any page that attaches a Remote; elsewhere it means the MCP client's application)

**Panel**:
One juicebox.js contact-map viewer inside a Page. A Page holds one or more, ordered left to right.
_Avoid_: browser, map, view

**Juicebox Panel Controls**:
Everything juicebox.js draws across the top of a Panel, above its contact map: the map's title and menu, the locus box, the resolution, colour-scale and normalization widgets. Shown or hidden for every Panel at once, and alike on every Page in a Room. juicebox.js calls this its navbar.
_Avoid_: navbar, controls (alone), toolbar, widgets

**Header**:
The strip across the top of the Page, above and apart from juicebox.js, holding everything the Page shows about itself rather than about the maps: whether it is in a Room, the Room's Join link, and the button that hides and shows the Juicebox Panel Controls. The only part of the Page that is not juicebox.js.
_Avoid_: navbar, toolbar, controls, room widget

**Room indicator**:
The small coloured dot in the Header showing whether the Page is in a Room, and pulsing when the model runs a tool against the Page.
_Avoid_: status light, panel (a Panel is a juicebox.js viewer)

### Links and state

**Session**:
The serialized view of every Panel, in juicebox.js wire format.
_Avoid_: state, snapshot (for the JSON itself)

**Snapshot link**:
A URL carrying `?session=`; opening it reproduces the view with no server involved.
_Avoid_: share URL, shareable URL, session link

**Room**:
A live relay channel on the juicebox-mcp server that Pages join, identified by a room id. Each conversation in the MCP client drives one Room, its own unless it joins another's; Rooms are otherwise isolated from one another.
_Avoid_: session, channel

**Join link**:
A URL carrying `?room=`; opening it shows the Page joined to that Room.
_Avoid_: share URL, connection URL, snapshot link

### Participants

**MCP client**:
The LLM-side program (Claude desktop, ChatGPT, …) that calls the tools.
_Avoid_: host, client (alone), Claude

**Remote**:
The control layer from juicebox-mcp attached to a Page's juicebox.js; it carries the Room's commands in and the Page's changes out.
_Avoid_: bridge, connection, client
