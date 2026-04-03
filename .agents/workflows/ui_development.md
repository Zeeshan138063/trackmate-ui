---
description: Specialized rules for React, Tailwind, and shadcn/ui development in Trackmate UI.
---
# JobOS UI Development Standards

To keep the JobOS UI premium and avoid wasting tokens on re-reading component logic:

## 1. Branding & Styling
- **Name**: JobOS (The OS for Your Job Search).
- **Core Components**: Use `<JobOsLogo />` from `@/components/JobOsLogo`.
- **Colors**: Use the "JobOS Brand" CSS variables in `src/index.css`.
- **Icons**: Use Lucide React.

## 2. Component Patterns (shadcn/ui)
- **Adding Components**: Use `npx shadcn@latest add [component]`.
- **Location**: UI primitives are in `src/components/ui/`.
- **Domain**: All public links point to `jobos.dev`.

## 3. Performance & Tokens
- **Avoid Duplication**: Check `src/components/` for existing layouts before creating new ones.
- **Concise Code**: Use functional components, small modular pieces, and avoid inline styles.

## 4. Animation
- Use standard Tailwind transitions or `framer-motion` (check package.json for availability).
