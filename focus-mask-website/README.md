# Focus Mask Website

The official website for **Focus Mask** - a browser extension that helps you eliminate distractions and focus on specific areas of your screen.

🌐 **Live Site**: [https://focusmask.app](https://focusmask.app)

## About Focus Mask

Focus Mask is a productivity browser extension that lets you:

- **Draw focus areas** - Select exactly what you want to see
- **Blur distractions** - Everything else fades into the background
- **Block interactions** - Prevent accidental clicks outside your focus zone
- **Stay in flow** - A floating toolbar keeps controls accessible

**Works on**: Chrome, Brave, Edge, and other Chromium-based browsers.

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **Language**: TypeScript
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Iconify](https://iconify.design/)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm run start
```

## Project Structure

```
focus-mask-website/
├── app/
│   ├── components/     # Reusable UI components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── BackButton.tsx
│   ├── sections/       # Page sections
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   └── GetExtension.tsx
│   ├── privacy-policy/ # Privacy policy page
│   ├── globals.css     # Global styles & design tokens
│   ├── layout.tsx      # Root layout with metadata
│   └── page.tsx        # Home page
├── public/             # Static assets
│   ├── logo.png
│   ├── demo-hero.mp4
│   └── favicon.ico
└── package.json
```

## Links

- 🧩 **Chrome Web Store**: [Get the Extension](https://chromewebstore.google.com/detail/focus-mask/gebdfpdpijonpofhhoogpifeoklmmgoc)
- 📄 **Privacy Policy**: [/privacy-policy](https://focusmask.app/privacy-policy)

## License

© 2026 Focus Mask. All rights reserved.
