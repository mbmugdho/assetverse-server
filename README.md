# AssetVerse (Server)

Backend API for the AssetVerse HR & Asset Management platform.

## Live URL
https://assetverse-server-lovat.vercel.app/
## Purpose
Provide secure REST APIs for authentication, asset management, requests, assignments, affiliations, analytics, and payments.

## Key Features
- JWT-secured authentication endpoints
- HR & Employee user management
- Asset inventory, requests, and assignment APIs
- Auto-affiliation and package limit enforcement
- Stripe integration for package upgrades
- Analytics endpoints for Recharts (asset types, top requested assets)
- Server-side pagination for asset lists

## Tech Stack / Main npm Packages
- Node.js, Express
- MongoDB (native driver)
- jsonwebtoken
- cors, cookie-parser
- Stripe

## Setup Instructions
```bash
npm install
npm run dev    # local dev
     
# or
npm start      # run with Node