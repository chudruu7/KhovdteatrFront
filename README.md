
# Cinema Ticketing — React + TailwindCSS (IMAX Modern)

Premium-looking cinema ticketing front-end inspired by Urgoo IMAX, built with Vite + React + TailwindCSS.

## ✨ Features
- Dark, premium IMAX-style UI
- Full-width hero with animated gradient title
- Large poster cards with hover scale, glass overlay, and Play Trailer button
- Modern Trailer modal (backdrop blur, fade/scale animation, Esc & outside click closes)
- Responsive horizontal carousels (2 / 3 / 5–6 posters per viewport)
- Tailwind-only styling & transitions

## 📦 Tech Stack
- React 18
- Vite 5
- TailwindCSS 3

## 🚀 Getting Started
```bash
npm i
npm run dev
# open http://localhost:5173
```

## 📁 Structure
```
src/
  components/
    Header.jsx
    Footer.jsx
    PageLayout.jsx
    HeroMovieSection.jsx
    MoviePoster.jsx
    TrailerModal.jsx
    MovieCarousel.jsx
  pages/
    Home.jsx
  data/
    movies.js
  main.jsx
  App.jsx
  index.css
```

## 🛠️ Tailwind Details
- Cards: `shadow-xl shadow-black/40 hover:shadow-2xl hover:shadow-black/60`
- Animations: `hover:scale-105`, `transition-all duration-300`, custom `fadeIn`, `scaleIn`, gradient text animation
- Poster aspect ratio: `aspect-[2/3]`
- Container: `container max-w-screen-2xl`

## 🔗 Notes
- Poster and trailer URLs are placeholders. Replace with your own assets.
- No backend included. Ticket flow button shows an alert for now.
