# Adhiraj Singh — personal site

This is a React site built with Vite. The five pages are separate HTML entry points, so their existing URLs continue to work:

- `index.html` — Home
- `projects.html` — Projects
- `filmmaking.html` — Filmmaking
- `albumwall.html` — Album Wall
- `credits.html` — Scrapbook (currently empty)

## Local development

```sh
npm install
npm run dev
```

Create a production build with `npm run build`; Vite writes all five pages to `dist/`. Preview that build locally with `npm run preview`.

GitHub Actions builds and deploys `dist/` on pushes to `main`. In the repository settings, set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**.

## Spotify Album Wall refresh

The Album Wall is generated from the public Spotify playlist embed and Spotify's
public oEmbed artwork endpoint. No Spotify developer credentials are required.

- `public/albumwall.json` contains the latest unique album covers.
- `scripts/update_album_wall.py` fetches the current playlist, resolves track
  artwork, and removes repeated covers.
- `.github/workflows/pages.yml` refreshes the data every day at 06:00 IST,
  builds the Vite site, and deploys it to GitHub Pages. Pushes to `main` and
  manual workflow runs also refresh and deploy the page.

The repository's **Settings → Pages → Build and deployment → Source** must be
set to **GitHub Actions**. The workflow uses the repository's `GITHUB_TOKEN`
with `contents: write` to commit refreshed JSON when it changes.
