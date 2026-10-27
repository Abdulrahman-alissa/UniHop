# UniHop: team plan (3 members)

| Member | Role | Files they own |
| --- | --- | --- |
| Abdul Rahman A. Al Issa | **Main.** Owns the repo and every shared file | `Home.jsx`, `Rides.jsx` + all shared files |
| Hassan A. Tohme | Pages | `RideDetails.jsx`, `RideForm.jsx` |
| Mohammad A. Zaiter | Pages | `Dashboard.jsx`, `Auth.jsx` (login and register) |

Each member has exactly 2 pages. `Driver.jsx` (driver profile, the second detail view) and `NotFound.jsx` (404) are shared pages and stay in the main repo.

## Shared files (main owns these)

`Driver.jsx`, `NotFound.jsx`, `App.jsx`, `main.jsx`, `store.jsx`, `data.js`, `index.css`, `lib/`, and all of `src/components/`
(Navbar, MobileMenu, Footer, Logo, RideCard, Field, Overlay, Button, ui, Toasts, CampusPhoto).

If Hassan or Mohammad needs a change in a shared file, ask Abdul or open a small pull request that only touches that file.

## Git workflow

1. Abdul pushes the main zip as the first commit on `main` and adds the others as collaborators.
2. Everyone works on their own branch: `feature/home-rides`, `feature/details-form`, `feature/dashboard-auth`.
3. Commit small and often, with messages like `Add seat selector to booking modal`.
4. Open a pull request to `main`. Someone else reviews before merging.
5. After each merge, everyone runs `git pull origin main`.

## Starting point

The main zip contains placeholder files for the 4 pages owned by Hassan and Mohammad so the app runs from day one.
When their page files are ready, they replace the placeholders in `src/pages/`.
