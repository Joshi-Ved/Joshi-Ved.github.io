# How to update this website

Everything the site says is in **one file: `content.js`**. You never need to touch the other files to add a project, a job, a skill or a hackathon.

| File | What it is | Edit it? |
|---|---|---|
| `content.js` | All text, links, projects, timeline, skills, wolf lines, photo file names | **Yes, this one** |
| `photos/` | Your pictures | **Yes, drop files here** |
| `styles.css` | Look of the cards: colours, fonts, spacing | Only to restyle |
| `world.js` | The 3D island, the wolf, the controls | Rarely (see "Move a place") |
| `app.js` | Builds the cards from `content.js` | Rarely |
| `index.html` | Page shell | Only for the browser-tab description |

How the site works: the visitor is the wolf on an island. Each chapter in `content.js` is a place on the island; walking into its coloured circle opens that chapter's card. "Read as a page" shows the same content as an ordinary scrolling page.

## 1. Put it online (one time)

1. On GitHub, create a **public** repository named exactly `Joshi-Ved.github.io`.
2. Upload all files from this folder to the repository root (Add file → Upload files → Commit).
3. Open the repository's Settings → Pages. Under "Build and deployment", choose **Deploy from a branch**, branch `main`, folder `/ (root)`, and save.
4. After a minute or two the site is live at `https://joshi-ved.github.io/`.

If you use a different repository name (for example `portfolio`), the steps are the same and the address becomes `https://joshi-ved.github.io/portfolio/`.

## 2. Make an update

1. Open `content.js` on GitHub and click the pencil icon (or edit it locally).
2. Change the text following the recipes below.
3. Commit. GitHub Pages republishes by itself in about a minute.
4. Hard-refresh the site (Ctrl+Shift+R) to see the change.

**Syntax rules that matter:** keep every quote `"` and comma `,`; items in a list are separated by commas; to use a quote mark inside text write `\"`. If the page goes blank after an edit, a comma or quote is missing in `content.js`: open the browser console (F12) and it names the line.

## 3. Recipes

### Add photos
1. Copy the picture into the `photos` folder (JPG, PNG or WebP; about 1600 px wide and under 500 KB).
2. Name it as `content.js` expects, or change the name in `content.js`. The slots are:
   - `profile.photo` (`photos/me.jpg`): your portrait on the welcome card, and the board at Base Camp.
   - `story.photos`, `path.photos`, `beyond.photos`: galleries inside those cards. The **first** photo of each also appears on the board standing in that place.
   - `image` on each project: a screenshot shown when the project is opened.
3. To add another photo to a gallery, add a line: `{ src: "photos/new-name.jpg", caption: "What it shows" },`
4. Empty slots show an "Add a photo" box. When you are done, set `showPhotoSlots: false` under `settings` and every unfilled slot disappears.

### Add a project
Copy this block into `builds.items` (first in the list = shown first). Each project automatically gets its own pillar in The Workshop:

```js
{
  name: "Project name",
  line: "One sentence a stranger would understand.",
  detail: "Two or three sentences: what it does, your part, one honest limitation or result.",
  stack: ["TypeScript", "PostgreSQL"],
  tags: ["Web"],            // these become the filter buttons
  status: "In progress",    // optional, delete the line when shipped
  image: "photos/project-name.jpg",   // optional screenshot, or ""
  url: "https://github.com/Joshi-Ved/repo-name"   // or "" if not public
},
```

A new tag (for example `"DevOps"`) adds a new filter button automatically.

### Add a job, role or internship
Add to the **top** of `path.items` (each item is a signpost on Milestone Trail):

```js
{ when: "Jan 2027 – now", role: "Your role", where: "Organisation", note: "One line on what you did." },
```

When a role ends, change `now` to the end month.

### Add a hackathon, talk or award
Add to `beyond.items` (each item plants a flag at The Summit):

```js
{ name: "Event name", note: "Result and what you built, in one line." },
```

### Update the numbers
`story.stats` holds CGPA, repo count and so on. Change the `value`.

### Add or remove a skill
Edit the lists inside `toolkit.groups`. Move a skill out of `toolkit.learning` once you have shipped something with it.

### Change what the wolf says
- At each stop: the `wolf:` text inside `chapters`.
- When tapped: the `facts` list. Keep each fact under about 90 characters so it fits on phones.

### Add an email or another link
Add to `profile.links`:

```js
{ label: "Email", url: "mailto:you@example.com" }
```

### Rename a place or change its colour
In `chapters`, change `label` (the button at the top), `place` (the name in the world) or `color`. Do not change an `id` (`start`, `story`, `path`, `builds`, `toolkit`, `beyond`, `contact`): the island uses it to find the right place. To remove a place, delete its line from `chapters`.

### Move a place on the island
Top of `world.js`, the `PLACES` block: `x` is left/right, `z` is up/down on the map, `r` is how close the wolf must be. Keep places at least 25 apart and inside a circle of radius 55.

### Change card colours or fonts
Top of `styles.css`, the `:root` block. The bright colours used for pillars, stats and tags are the `POP` list at the top of `app.js` and `world.js` (keep the two lists the same).

## 4. When to update (suggested habit)

- **After every project you ship:** add it to Builds, bump the repo count.
- **After every hackathon or event:** add one line to Beyond, within the week.
- **Start of each semester:** check CGPA, year, role titles and the "Learning now" list.
- **Twice a year:** remove anything you would no longer show a stranger.

## 5. Asking Claude to do it

Paste the current `content.js` and say, for example:

> Here is my site's content.js. Add a project called X (what it does, stack, link), move it to the top of Builds, and add "X hackathon, finalist" to Beyond. Give me back the full file.

Then replace the file on GitHub with the result.

## 6. If something breaks

| Symptom | Likely cause | Fix |
|---|---|---|
| Blank page | Missing comma or quote in `content.js` | Console (F12) shows the line; fix and commit |
| No island, only the page view | Browser without WebGL, or the three.js CDN is blocked | The site falls back to the page view by itself; test in another browser |
| A photo doesn't show | File name or extension differs from `content.js` (names are case-sensitive on GitHub) | Make the two match exactly |
| Change not showing | Browser cache or Pages still deploying | Wait a minute, hard-refresh |
| 404 at the address | Pages not enabled, or files not in the repo root | Recheck step 1 |
