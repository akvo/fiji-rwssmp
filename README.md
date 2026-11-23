# Fiji RWSSMP Launch Site

Static launch-ceremony site for **Fiji's Rural Water Supply and Sanitation Master Plan, 2026–2050**.

Cloned from the original build and prepared for GitHub Pages at **https://fiji-rwssmp.akvo.org**.

## Structure

```
index.html                 # ceremony page (backdrop → launch → countdown → reveal)
styles.css                 # base styles
ministry-theme.css         # ministry theme
ceremony-refinements.css   # ceremony refinements
script.js                  # countdown / launch interactions
agenda.pdf                 # /agenda.pdf
master-plan.pdf            # /master-plan.pdf (full Master Plan, 232 pp.)
assets/
  ministry-logo.jpg
  dws-logo.png
  rwssmp-cover.png
  rwssmp-qr.svg            # QR shown on the reveal screen
  fiji-rural-water-supply-sanitation-master-plan-2026.pdf   # Master Plan (QR / in-page link target)
CNAME                      # fiji-rwssmp.akvo.org
.nojekyll                  # serve files as-is (no Jekyll processing)
```

The Master Plan PDF is kept at its original `assets/…` path (the QR code and in-page links point there) and is also exposed at the clean URL `/master-plan.pdf`.

## Deploy (GitHub Pages)

1. Push this repository to GitHub.
2. **Settings → Pages → Build and deployment → Source: Deploy from a branch**, branch `main`, folder `/ (root)`.
3. The `CNAME` file sets the custom domain to `fiji-rwssmp.akvo.org`. Add the matching DNS record (a `CNAME` for `fiji-rwssmp` → `<org>.github.io`) at the DNS provider.
4. Enable **Enforce HTTPS** once the certificate is issued.

## Local preview

```sh
python3 -m http.server 8000
# open http://localhost:8000
```
