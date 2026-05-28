# Markdown Wiki

A local Markdown wiki for browsing an Obsidian-managed `content/` folder in a clean web UI.

The app serves Markdown notes from disk, renders them as readable HTML, and builds a collapsible folder tree from the folder structure. Obsidian can keep managing the notes; this app focuses on browsing and reading them.

## Features

- Browse Markdown files from `content/`
- Collapsible sidebar folder tree
- Linked, Title Case breadcrumbs
- Obsidian-style wiki links: `[[Note Name]]`
- Obsidian-style embedded images: `![[image.png]]`
- Frontmatter support through `gray-matter`
- Syntax highlighting for fenced code blocks
- Static media served from `content/media`

## Project Structure

```text
client/          React + Vite frontend
server/          Express API for reading content files
content/         Obsidian vault / Markdown content
server/db/       SQLite database location
_docs/           Project notes and implementation specs
```

## Setup

Install dependencies for the root, client, and server:

```bash
npm run install:all
```

Run the app:

```bash
npm run dev
```

By default:

- API runs on `http://localhost:3020`
- Vite runs on its default local dev URL

If port `3020` is already in use, run the server and client separately:

```bash
PORT=3021 npm --prefix server run start
API_TARGET=http://localhost:3021 npm --prefix client run dev
```

## Content

Put Markdown files anywhere under `content/`.

```text
content/
  Projects/
    Roadmap.md
  Notes/
    Ideas.md
  media/
    diagram.png
```

Folders become collapsible sections in the sidebar. Markdown files become readable content pages.

The app ignores Obsidian internals such as `content/.obsidian` and serves files in `content/media` through `/media`.

## Markdown Links

Use standard Markdown links:

```markdown
[Roadmap](Projects/Roadmap.md)
```

Use Obsidian wiki links:

```markdown
[[Roadmap]]
[[Projects/Roadmap|Project roadmap]]
```

Embed media from `content/media`:

```markdown
![[diagram.png]]
![[diagram.png|Architecture diagram|640]]
```

## API

The server currently exposes only content endpoints:

```text
GET /api/content/tree
GET /api/content?path=Projects
GET /api/content/wiki/:target
GET /media/:file
```

`server/db/content.sqlite` exists for future app metadata, but it currently does not need tables for browsing Markdown content.

## Build

Build the frontend:

```bash
npm --prefix client run build
```

## Releases

Releases are automated with GitHub Actions and Release Please.

- `client` starts at `v0.1.0`
- `server` starts at `v0.1.0`
- Release PRs are opened automatically after changes land on `main`
- Merging a release PR creates GitHub Releases and updates versions/changelogs
- Version bumps follow semantic versioning from Conventional Commits

Use commit messages like:

```text
fix(client): correct breadcrumb links
feat(server): add content search endpoint
feat(client)!: change content routing
```

Semantic versioning behavior:

- `fix:` creates a patch release
- `feat:` creates a minor release
- `!` or `BREAKING CHANGE:` creates a major release
