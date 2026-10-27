# UniHop

Student ride-share for LAU Beirut and LAU Byblos.

**Team:** Callback Crew
**Members:** Abdulrahman Al Issa, Hassan Tohme, Mohammad Zaiter
**Course:** CSC443, Fall 2026, Project Part 1

**Live app:** _paste your deployed link here_
**Repository:** _paste your GitHub link here_

## Assigned topic and data entities

Topic: **Campus Carpool**, built as the app **UniHop**. Students driving to campus post rides with open seats; other students request and book them. The app serves the **LAU Beirut** and **LAU Byblos** campuses.

| Entity | Main fields |

| Users (also the drivers) | id, name, email, campus, gender, rating, car |
| Rides | id, driverId, direction (toCampus or fromCampus), girlsOnly, originArea, originLabel, campus, meetingPoint, departAt, returnAt, seatsTotal, pricePerSeat, tags, notes, status |
| Bookings | id, rideId, passengerId, seats, status (pending, confirmed, declined, cancelled), note |

Girls-only rule: a girl driver can mark a ride girls-only. Only girl accounts see and book it.

Phase 2 ownership rule: only the driver can edit or cancel their ride. Phase 1 already hides and blocks those controls for everyone else.

## Pages and who built them

A team of 3 delivers 6 required pages, two per member. Two extra shared pages (Driver Profile, the second detail view, and the 404 page) belong to the main repo.

| Page | Route | Built by |

| Homepage (upcoming rides) | `/` | Abdulrahman Al Issa |
| Ride List (filter by origin, campus, date, seats) | `/rides` | Abdulrahman Al Issa |
| Ride Details | `/rides/:id` | Hassan Tohme |
| Post / Edit Ride form | `/rides/new`, `/rides/:id/edit` | Hassan Tohme |
| My Rides & Bookings dashboard | `/dashboard` | Mohammad Zaiter |
| Login / Register (one page, also at `/login` and `/register`) | `/auth` | Mohammad Zaiter |
| Driver Profile (second detail view, shared) | `/drivers/:id` | Shared, main repo (Abdulrahman Al Issa) |

Shared pieces (navbar, mobile side menu, ride card, form fields, modals, store, theme)

## Technologies

React 19 (functional components, hooks), React Router (HashRouter), Tailwind CSS v4, Vite, modern JavaScript (ES6+), lucide-react icons, Git and GitHub.

## Run locally

```bash
git clone <repo-url>
cd unihop
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve the production build locally
```

Requires Node 18 or newer. Demo login: `test@lau.edu` / `carpool123`.

## Deployment

The repo includes `.github/workflows/deploy.yml`. Push to `main`, then in GitHub go to **Settings, Pages, Source: GitHub Actions**. The site appears at `https://<username>.github.io/<repo>/`. Netlify and Vercel also work: build command `npm run build`, output folder `dist`. The app uses `HashRouter`, so links and refreshes work on any static host.

## How mock data is used to simulate the backend

- `src/data.js` holds seed users, rides and bookings. Ride times are generated relative to the current time, so the demo always shows upcoming rides.
- `src/store.jsx` loads that data into React state (`useState`) and exposes the actions the pages call: `createRide`, `updateRide`, `setRideStatus`, `bookRide`, `cancelBooking`, `respondToBooking`, `login`, `register`.
- Every create, edit and cancel updates that state, so the app behaves as if it had a backend. Nothing is saved: a refresh restores the seed data, exactly as the brief describes.
- In Phase 2 these store actions are replaced by API calls.

## Requirements checklist (Phase 1 brief)

| Requirement | Where |

| Git repository, regular commits, branching, everyone contributes | GitHub history (see contributions below) |
| Vite + React project | `package.json`, `vite.config.js` |
| Functional components, `useState`, `useEffect` | all pages, `src/store.jsx`, `src/components/Overlay.jsx` |
| Homepage | `src/pages/Home.jsx` |
| List view with search/filter UI | `src/pages/Rides.jsx` (area, campus, date, seats, max fare, sort) |
| Two detail views | `src/pages/RideDetails.jsx`, `src/pages/Driver.jsx` |
| Add/Edit form with validation | `src/pages/RideForm.jsx` |
| User dashboard / profile | `src/pages/Dashboard.jsx` |
| Login and Register forms with validation | `src/pages/Auth.jsx` |
| Props between components | `RideCard`, `Field`, `Modal`, `SeatMeter`, `Avatar` |
| Mobile-first responsive Tailwind UI, consistent theme | utility classes everywhere; colour tokens in `src/index.css` |
| React Router client-side navigation, persistent navbar | `src/App.jsx`, `src/components/Navbar.jsx`, `src/components/MobileMenu.jsx` (slide-out menu on phones) |
| Theme toggler (light/dark) | navbar button, `src/store.jsx` |
| Show/hide elements, modals | booking and cancel dialogs, mobile filter sheet, password toggle |
| Search and filter on mock data | `src/pages/Rides.jsx` |
| Simulated CRUD that doesn't persist on refresh | `src/store.jsx` |
| Semantic HTML, alt text, labelled forms, ARIA | skip link, `<label>` on every input, `aria-*` attributes, logo alt text |
| Clean, commented code | comments on each page and the store |

## Team contributions

| Member | Pages | Main work |

| Abdulrahman Al Issa | Homepage, Ride List | _list your main commits and features_ |
| Hassan Tohme | Ride Details, Post/Edit Ride | _list your main commits and features_ |
| Mohammad Zaiter | Dashboard, Login/Register | _list your main commits and features_ |

## Screenshots

......
