# 📊 MDX Presentation Viewer

A clean, simple presentation viewer that turns your markdown files into beautiful slides. Just write in markdown, and it handles the rest.

## What This Does

Ever wanted to make presentations without PowerPoint or Google Slides? This tool lets you write your slides in markdown (`.mdx` files) and view them in a clean, modern interface. No complex software needed - just text files.

### Features That Actually Matter

- **Write in Markdown** - Use `#` for titles, `-` for bullet points, and code blocks. It's that simple.
- **Multiple Presentations** - Drop all your `.mdx` files in the `presentation/` folder and switch between them instantly.
- **Shareable URLs** - Each slide has its own URL. Share `?p=osi&s=3` to send someone directly to slide 3.
- **Keyboard Controls** - Navigate with arrow keys, jump to slides with number keys (1-9).
- **Export to PDF** - One-click PDF export (no installation needed).
- **Mobile Friendly** - Swipe to navigate on phones and tablets.
- **Auto-Hiding Controls** - Clean view with controls that fade away when you're not using them.

## Quick Start

### 1. Clone the Repo
```bash
git clone https://github.com/yourusername/mdx-presentation-viewer.git
cd mdx-presentation-viewer
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Add Your Slides
Create `.mdx` files in the `presentation/` folder:
```
presentation/
├── osi.mdx       # Your first presentation
├── security.mdx  # Your second presentation
└── networking.mdx
```

### 4. Start the Server
```bash
npm start
```

### 5. Open in Browser
Go to `http://localhost:3000`

## How to Write Slides

Each `.mdx` file is a presentation. Split slides using `---` (three dashes):

```markdown
# Welcome to My Presentation

This is the first slide.

---

## Slide Title

- First point
- Second point
- Third point

---

## Code Example

```javascript
console.log('Hello World');
\```

---

## Thank You

Questions?
```

That's it. Each `---` creates a new slide.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `→` or `↓` | Next slide |
| `←` or `↑` | Previous slide |
| `1`-`9` | Jump to slide 1-9 |
| `Ctrl+Shift+→` | Next presentation |
| `Ctrl+Shift+←` | Previous presentation |
| `Ctrl+Shift+P` | Export as PDF |
| `Ctrl+Shift+C` | Copy shareable link |
| `F` | Fullscreen |
| `Home` | First slide |
| `End` | Last slide |
| `R` | Reload current presentation |

## Folder Structure

```
project/
├── presentation/          # Put your .mdx files here
│   ├── osi.mdx
│   ├── security.mdx
│   └── networking.mdx
├── public/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── server.js
├── package.json
└── README.md
```

## URL Parameters

Share specific slides using URL parameters:

```
http://localhost:3000/?p=osi&s=3
```
- `p` = presentation name (filename without .mdx)
- `s` = slide number (0-based)

## Export as PDF

Two ways to export:

1. **Click the 📄 button** in the controls
2. **Press `Ctrl+Shift+P`**

The PDF includes:
- Title page
- All slides
- End page
- Slide numbers and presentation name

## Contributing

We'd love your help! Here's how you can contribute:

### Found a Bug?
Open an issue with:
- What happened
- What you expected to happen
- Steps to reproduce

### Want to Add a Feature?
1. Fork the repo
2. Create a branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Test it works
5. Open a pull request with a clear description

### Ideas We'd Like Help With
- [ ] Dark/light theme toggle
- [ ] Speaker notes
- [ ] Presentation timer
- [ ] Custom CSS per presentation
- [ ] Export to PowerPoint
- [ ] Presentation thumbnails

### Code Style
- Keep it simple
- Add comments for tricky parts
- Test on different screen sizes
- Make sure keyboard shortcuts still work

## Requirements

- Node.js (v16 or newer)
- npm (comes with Node)

## License

MIT - Use it however you want.

## Questions?

Open an issue and we'll help you out.

---

**Made with ❤️ for people who prefer markdown over PowerPoint**
