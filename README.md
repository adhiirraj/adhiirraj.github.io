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
