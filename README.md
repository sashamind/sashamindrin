# sashamindrin

Personal portfolio site — Sasha Mindrin, identity & motion designer.

## Structure

```
sashamindrin/
├── index.html              # home — logo grid
├── project.html            # single project page (coming soon)
├── about.html              # about (coming soon)
├── contact.html            # contact (coming soon)
├── css/
│   └── style.css
├── js/
│   └── main.js
└── assets/
    └── projects/
        └── project-1/
            └── thumb.png   # square thumbnail, recommended 600×600px
```

## Adding a project

1. Create a folder `assets/projects/your-project-name/`
2. Add `thumb.png` (square, min 600×600px)
3. Copy a `.card` block in `index.html`, update `href`, `img src`, and `data-en` / `data-ru` labels

## Deploy to GitHub Pages

```bash
git add .
git commit -m "init"
git push origin main
```

Then in GitHub repo → Settings → Pages → Source: `main / root`

Site will be live at: `https://sashamindrin.github.io/sashamindrin/`