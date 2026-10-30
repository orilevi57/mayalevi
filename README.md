# Maya Levi – portfolio site

Static site, no build step. Plain HTML/CSS/JS.

- `index.html` – home
- `Projects.html` – work index
- `hyro.html`, `encore.html`, `booth.html`, `memoria.html` – project pages
- `AboutMe.html`, `ContactPage.html`
- `site.css` / `site.js` – shared styles and scripts; `work.css` / `work.js` – work index only; `hero3d.js` – home hero animation (loads three.js from cdnjs)
- `media/` – images (webp) and videos (mp4)

## Deploy
Replace the contents of the existing repo (orilevi57/mayalevi) with this folder and push. If GitHub Pages / Netlify / Vercel is connected, the site updates on its own. Internal links are relative, so it works at a domain root or a sub-path.

Notes
- Largest videos are ~14 MB (under GitHub's 100 MB file limit).
- The contact form opens the visitor's email app (mailto). To send messages directly, swap in a form service such as Formspree.
