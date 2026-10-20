# Smile Arcade

Interactive dental games for kids waiting at the dentist. Tap a game card, play Cavity Catch or Brush Blast, and keep every tooth happy.

This is the Smile Arcade hub, with Toothy the mascot ready to cheer you on.

## Play now

```bash
npm install
npm run dev -- --port 43147
```

Open [http://localhost:43147](http://localhost:43147).

## Single-file version

`public/smile-arcade.html` contains the complete hub, Cavity Catch, Brush
Blast, and Smile Match in one editable file. Its styling and JavaScript are included directly
in the HTML, so you can double-click it to open it in a browser without
installing anything.

While the development server is running, view it at
[http://localhost:43147/smile-arcade.html](http://localhost:43147/smile-arcade.html).

## What’s included

- **Home hub** with the Smile Arcade logo and six game cards
- **Cavity Catch** — start screen with how to play, then tap wiggly germs before the 45-second timer runs out. Best score is saved in the browser.
- **Brush Blast** — clean a dirty tooth with three tools: brush plaque to uncover stuck food, blast it, then rinse until it shines.
- **Smile Match** — flip cards to find matching pairs. Each card shows a dental tool and its name, and the board shuffles every round.
- **Coming soon** screens for Floss Run, Sugar Sort, and Smile Art
- Kid-friendly 404 and error pages

## Stack

Next.js, TypeScript, Tailwind CSS, and shadcn/ui. The production build is a static export (`out/`) so it can run on GitHub Pages.

## Host on GitHub Pages

This app cannot be dropped onto Pages as raw source. GitHub Pages only serves static files, so you publish the Next.js export. See `UPLOAD-TO-GITHUB.txt` for the click-by-click upload steps.

GitHub Actions reads `.github/workflows/pages.yml`. Folders that start with a dot are hidden on Mac and Windows, so a download zip of this project also includes a visible `github` folder with the same workflow. **Rename `github` to `.github` before you upload** if you cannot see the dotted folder.

After the files are in a GitHub repository:

1. Open **Settings → Pages**.
2. Set **Source** to **GitHub Actions**.
3. Wait for **Actions → Deploy to GitHub Pages** to finish, or push another commit to `main`.
4. Play it at `https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPO_NAME/`.

Project sites automatically use a `/YOUR_REPO_NAME` base path so images, game routes, and the Back button still work. A user/org site named `YOUR_USERNAME.github.io` is hosted at the domain root instead.

If you later attach a custom domain at the site root, set a repository variable named `BASE_PATH` to an empty value so the build does not prefix paths.

Local production preview:

```bash
NEXT_PUBLIC_BASE_PATH=/smile-arcade npm run build
npx --yes serve out
```

Then open the printed local URL and add `/smile-arcade/` if you set that base path.

## Next games to build

- Floss Run — slide floss between teeth to collect stars
- Sugar Sort — sort treats into healthy and not-so-healthy piles
- Smile Art — color and decorate a happy smile
