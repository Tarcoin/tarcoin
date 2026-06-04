# Whitepaper PDF

Place the `whitepaper.pdf` file in this directory.

The source markdown is located at `docs/TARCOIN_WHITEPAPER.md`.

## How to generate the PDF

### Option 1: Using a Markdown-to-PDF converter
Install one of the following tools and convert the markdown:

- **md-to-pdf** (npm): `npx md-to-pdf docs/TARCOIN_WHITEPAPER.md website/public/docs/whitepaper.pdf`
- **Pandoc**: `pandoc docs/TARCOIN_WHITEPAPER.md -o website/public/docs/whitepaper.pdf`
- **VSCode**: Right-click the markdown file → "Export to PDF" (if extension installed)

### Option 2: Manual
1. Open `docs/TARCOIN_WHITEPAPER.md` in a markdown editor
2. Export/Print to PDF
3. Save as `website/public/docs/whitepaper.pdf`