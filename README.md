# 🚗 SPARC-TinyFish
### Smart Parking, Access, Reservations & City Intelligence

**An intelligent parking platform connecting drivers, parking owners, and urban space management through digital reservations, QR-based verification, and web intelligence powered by TinyFish.**

<p align="center">
  <a href="https://sparc-nu.vercel.app/">Live Demo</a> ·
  <a href="https://github.com/anubhavsingh23906-code/SPARC-TinyFish">GitHub Repository</a>
</p>

---

## 🌍 Overview

Finding reliable parking in busy urban areas can be frustrating. Drivers spend time searching for available spaces, parking owners struggle to manage reservations, and manual verification can make the parking experience inefficient.

**SPARC-TinyFish** aims to make parking discovery and reservations easier through a unified digital platform. Users can discover parking spaces, book a slot, complete the payment flow, and receive a QR code for reservation verification. Parking owners can manage their spaces through a dedicated owner interface.

The project combines parking management with TinyFish web intelligence to explore how real-time information from external websites can support better parking discovery and decision-making.

## ❗ Problem Statement

Urban parking presents several challenges:

- **Time-consuming discovery:** Drivers may struggle to find suitable parking near their destination.
- **Limited visibility:** Parking availability and pricing can be difficult to compare across locations.
- **Manual reservation management:** Owners need an efficient way to manage parking spaces and bookings.
- **Verification challenges:** Drivers and parking operators need a convenient way to verify reservations.
- **Fragmented information:** Parking-related information may be spread across different websites and services.

## 💡 Proposed Solution

SPARC-TinyFish brings parking discovery, reservation management, and verification into one platform.

### Key Features

- **Parking discovery:** Browse parking spaces and their available details.
- **User booking flow:** Select a parking space and make a reservation.
- **Payment flow:** Support the application's configured payment process.
- **QR-based verification:** Generate a QR code associated with a reservation for verification.
- **Owner dashboard:** Provide a dedicated interface for parking owners to manage parking information and bookings.
- **City intelligence:** Present city-level analytics through the application's dashboard.
- **TinyFish web intelligence:** Integrate web search or browser-based information extraction to discover and summarize relevant external parking information.

*TinyFish-powered features are subject to implementation and testing; only verified capabilities should be considered live.*

## 👥 Target Users

| User | Value |
|---|---|
| Drivers and commuters | Discover and reserve parking more conveniently |
| Parking-space owners | Manage spaces and reservations digitally |
| Parking operators | Simplify booking verification and operations |
| Urban planners and administrators | Explore city-level parking insights |
| Visitors to busy areas | Find relevant parking information before travelling |

## 🧰 Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js, React, TypeScript |
| Styling | Tailwind CSS |
| Backend | Next.js API routes |
| Database | MongoDB Atlas |
| Database integration | Mongoose |
| QR codes | `qrcode` package |
| Data visualization | Recharts |
| Validation | Zod |
| Web intelligence | TinyFish API |
| Deployment | Vercel |

## 🏗️ Technical Architecture

```text
                  ┌──────────────────────┐
                  │      SPARC Users     │
                  │ Drivers / Owners     │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │ Next.js + React UI    │
                  │ Parking / Dashboard   │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │ Next.js API Routes   │
                  │ Validation & Logic   │
                  └──────┬────────┬──────┘
                         │        │
                ┌────────▼───┐  ┌─▼────────────────┐
                │ MongoDB    │  │ TinyFish API     │
                │ Atlas      │  │ External Web     │
                │ Bookings   │  │ Intelligence     │
                │ Spaces     │  └──────────────────┘
                └────────────┘
                         │
                         ▼
                ┌────────────────────┐
                │ QR Reservation     │
                │ Verification       │
                └────────────────────┘
```

## 🐟 How TinyFish API Will Be Integrated

TinyFish is intended to extend SPARC beyond its own parking database by enabling web-based information discovery.

### Planned workflow

1. A user enters a destination or parking-related search.
2. The SPARC backend sends a relevant task to TinyFish using a server-side API route.
3. TinyFish searches or navigates supported external websites to collect relevant information.
4. The backend validates and normalizes the returned results.
5. SPARC presents useful findings to the user alongside its own parking listings.
6. Users can use these insights to make more informed parking decisions.

### Potential use cases

- Discover publicly listed parking facilities near a destination.
- Extract parking rates, facility details, and operating information from supported websites.
- Compare external parking options with spaces listed directly in SPARC.
- Summarize information from multiple sources to help users shortlist parking options.

### Integration principles

- Keep `TINYFISH_API_KEY` on the server; never expose it in client-side code.
- Call TinyFish through a protected backend API route.
- Validate API responses before displaying them.
- Handle timeouts, rate limits, and external website failures gracefully.
- Label externally sourced information and show its source when available.
- Do not treat scraped availability or pricing as guaranteed live inventory.
- Require the application's own booking and payment validation before confirming a reservation.

**Note:** TinyFish integration is mandatory for HackIIITD. The integration should be tested against the actual TinyFish API before being described as fully operational.

## 🔄 Core User Journey

### Driver journey

1. Open SPARC.
2. Browse parking spaces and review available details.
3. Select a suitable space and initiate a booking.
4. Complete the configured payment process.
5. Receive a reservation QR code.
6. Present the QR code for reservation verification.

### Parking owner journey

1. Open the owner interface.
2. Manage parking-space information.
3. Review incoming reservations.
4. Verify reservation details through the supported workflow.
5. Manage parking operations digitally.

*Exact availability, payment, and verification behaviour depends on the application's implemented backend and configuration.*

## 📈 Scalability, Feasibility & Use Cases

### Feasibility

SPARC builds on a modern web stack with a database-backed architecture and server-side API routes. This supports incremental development and integration without requiring a separate application for every feature.

### Scalability

Potential future improvements include:

- Geospatial parking discovery.
- Better availability synchronization.
- Caching of external web intelligence results.
- Background jobs for periodic information refresh.
- Role-based access control for drivers and owners.
- Monitoring, logging, and rate limiting.
- Integration with additional parking operators and payment providers.

### Real-world applications

- Commercial parking lots and garages.
- Shopping centres and business districts.
- Hospitals, universities, and event venues.
- Tourist destinations and crowded urban areas.
- Parking operators managing multiple facilities.

## 🧪 MVP / Prototype

The project has a web prototype that can be explored here:

- **Live demo:** https://sparc-nu.vercel.app/
- **Source code:** https://github.com/anubhavsingh23906-code/SPARC-TinyFish

The prototype is intended to demonstrate the parking user experience, owner-facing workflows, reservation flow, QR-based verification, and the proposed TinyFish integration.

The deployed demo may require configured environment variables and a reachable database. External API functionality should be considered verified only after a successful end-to-end test.

## 🚀 Local Setup

### Prerequisites

- Node.js and npm
- A MongoDB Atlas database
- A TinyFish account and API key

### 1. Clone the repository

```bash
git clone https://github.com/anubhavsingh23906-code/SPARC-TinyFish.git
cd SPARC-TinyFish
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
MONGODB_URI=your_mongodb_atlas_connection_string
TINYFISH_API_KEY=your_tinyfish_api_key
AUTH_SECRET=your_long_random_secret
NEXT_PUBLIC_MAP_TILES=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

Use the actual variable names required by the application. Keep credentials private and never commit `.env.local`.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 🔐 Security

- Store API keys and database credentials in environment variables.
- Never commit `.env.local` or other secret files.
- Restrict MongoDB Atlas network access to trusted IP addresses or approved production network configurations.
- Validate booking requests on the server.
- Verify payment status server-side before confirming paid bookings.
- Treat QR codes as reservation references, not proof of payment by themselves.
- Protect owner operations with appropriate authentication and authorization.
- Treat external web content as untrusted input.

## 🛣️ Roadmap

- [ ] Complete and verify MongoDB Atlas connectivity.
- [ ] Validate user and owner workflows end to end.
- [ ] Test booking, payment, and QR verification.
- [ ] Complete the TinyFish API integration.
- [ ] Add external parking discovery and source-aware results.
- [ ] Improve failure handling, security, and automated tests.
- [ ] Validate deployment environment variables.
- [ ] Publish a final hackathon demo.

## 👨‍💻 Team Hackerz

- **Anubhav Singh** — Team Leader
- **Tanishka Israni** — Team Member
- **Mudit Kumar Singh** — Team Member

## 🏆 HackIIITD 2026

SPARC-TinyFish is being developed for **HackIIITD 2026**, presented by TinyFish and organized by the Tech Council, IIIT Delhi, as part of Esya.

Our goal is to explore how parking management and web intelligence can work together to make urban parking more convenient, transparent, and accessible.

---

**Built by Team Hackerz.**

*Making urban parking smarter, one reservation at a time.*
              MongoDB
