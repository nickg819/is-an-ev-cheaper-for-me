---
name: Is an EV Cheaper for Me?
description: A plain, square-cornered calculator that states the answer first in condensed caps and shows the working in two flat color-coded columns.
colors:
  sky-paper: "#dff0f9"
  sky-cream: "#f6fbfe"
  field-white: "#ffffff"
  cool-ink: "#12202a"
  ink-soft: "#3d5463"
  line: "#a9c1ce"
  line-strong: "#6f8c9c"
  night: "#12202a"
  on-night: "#f6fbfe"
  forest-teal: "#1b4440"
  brick-peach: "#a96353"
  gain-green: "#1b5e20"
  loss-red: "#9c1c12"
  dark-paper: "#0e171d"
  dark-cream: "#16232c"
  dark-ink: "#e8f1f6"
  dark-ink-soft: "#a9bcc8"
  dark-line: "#2c4150"
  dark-line-strong: "#5b7a8c"
  dark-night: "#070d11"
  dark-teal: "#2f7a70"
  dark-gain: "#6fd08a"
  dark-loss: "#ff9d90"
typography:
  display:
    fontFamily: "Archivo, Arial Narrow, system-ui, sans-serif"
    fontSize: "clamp(30px, 6vw, 46px)"
    fontWeight: 800
    lineHeight: 1.12
    letterSpacing: "0.015em"
  headline-section:
    fontFamily: "Archivo, Arial Narrow, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "0.015em"
  numeral:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.05
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 500
    lineHeight: 1.45
  label:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    lineHeight: 1.45
  note:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.45
rounded:
  none: "0"
spacing:
  xs: "6px"
  sm: "12px"
  md: "18px"
  lg: "22px"
  xl: "28px"
components:
  result:
    backgroundColor: "{colors.sky-cream}"
    textColor: "{colors.cool-ink}"
    rounded: "{rounded.none}"
    padding: "26px 28px 28px"
  result-phone:
    backgroundColor: "{colors.night}"
    textColor: "{colors.on-night}"
    rounded: "{rounded.none}"
    padding: "18px 16px 20px"
  amount-block:
    backgroundColor: "{colors.forest-teal}"
    textColor: "#ffffff"
    rounded: "{rounded.none}"
    padding: "0 0.22em"
  column-gas-header:
    backgroundColor: "{colors.brick-peach}"
    textColor: "#ffffff"
    rounded: "{rounded.none}"
    padding: "9px 14px"
  column-ev-header:
    backgroundColor: "{colors.forest-teal}"
    textColor: "#ffffff"
    rounded: "{rounded.none}"
    padding: "9px 14px"
  card:
    backgroundColor: "{colors.sky-cream}"
    textColor: "{colors.cool-ink}"
    rounded: "{rounded.none}"
    padding: "18px"
  group:
    backgroundColor: "{colors.sky-cream}"
    rounded: "{rounded.none}"
    padding: "14px"
  input:
    backgroundColor: "{colors.field-white}"
    textColor: "{colors.cool-ink}"
    rounded: "{rounded.none}"
    padding: "10px 12px"
    height: "46px"
  tab:
    backgroundColor: "{colors.sky-cream}"
    textColor: "{colors.cool-ink}"
    rounded: "{rounded.none}"
    padding: "9px 12px"
    height: "44px"
  tab-selected:
    backgroundColor: "{colors.night}"
    textColor: "#ffffff"
  table-cell:
    backgroundColor: "{colors.sky-cream}"
    padding: "10px 14px"
---

# Design System: Is an EV Cheaper for Me?

## Overview

**Creative North Star: "The Itemized Receipt"**

The page states the answer in one sentence and then shows every line of the working. It is flat and square: thin 1px cool lines, no radii on containers, no shadows, no badge or starburst, and a faint paper grain over a sky-blue ground. Condensed all-caps Archivo carries the headline and section titles. Everything else is plain Archivo at a few fixed sizes. Color carries meaning: teal always means EV, brick peach always means gas.

Density is moderate. The result sits first, the math columns and bar pair follow, the form comes last. On a phone the result becomes a dark night card with both totals, a sticky peek line stays pinned while editing, and the form splits into tabs. Personality lives only in help text and empty states; labels and headings stay literal.

The build departs from the direction contract in no material way. Where it differs from the approved comp is listed under Known open items.

**Key Characteristics:**
- Answer first; working shown below it in the same flat vocabulary.
- Square corners on every container; 1px lines in place of heavy outlines.
- Two fills carry meaning (teal EV, peach gas), each always with white text.
- Condensed caps display type; tabular numerals for money.
- Light and dark schemes that follow the system setting.

## Colors

A cool, low-chroma sky-and-ink palette with exactly two saturated fills, one per side of the comparison.

### Primary
- **Forest Teal** (`forest-teal`): The EV. Fills the saving amount in the headline, the EV column header and output, the EV bar, the phone EV tile, and the accent of radios and checkboxes. In dark scheme it lifts to **Dark Teal** (`dark-teal`) so white text and bars still read.

### Secondary
- **Brick Peach** (`brick-peach`): The gas car or cars. Darkened from a lighter peach so white text passes contrast. Fills the gas column header and output, the gas bar, the phone gas tile, and the brand mark's nucleus. It is unchanged in dark scheme.

### Neutral
- **Sky Paper** (`sky-paper`): Page ground, with a faint grain overlay in light scheme only.
- **Sky Cream** (`sky-cream`): Surface for the result, columns, bars panel, table, cards and groups.
- **Field White** (`field-white`): Input background, the only pure white surface.
- **Cool Ink** (`cool-ink`): Text, focus outline, and the same value as Night.
- **Ink Soft** (`ink-soft`): Secondary text: units, hints, notes, captions, footer.
- **Line** (`line`) and **Line Strong** (`line-strong`): Container borders and row dividers; the strong line is for input borders, the bar axis, and the total row.
- **Night** (`night`) and **On Night** (`on-night`): The phone result card and sticky peek line.
- **Gain Green** (`gain-green`) and **Loss Red** (`loss-red`): Signed numbers in the breakdown table only, with lighter dark-scheme variants (`dark-gain`, `dark-loss`).
- Dark scheme neutrals: `dark-paper`, `dark-cream`, `dark-ink`, `dark-ink-soft`, `dark-line`, `dark-line-strong`, `dark-night`.

### Named Rules
**The Two-Fill Rule.** Teal means EV and peach means gas, on every surface, in both schemes. No third saturated fill exists; do not introduce one for emphasis.

**The White-On-Color Rule.** Every colored fill carries white text. Never place dark text on teal, peach or night. If a fill fails contrast, darken the fill, not the text.

**The Signed-Number Rule.** Green and red appear only on positive and negative dollar values in the breakdown table, never as decoration or as brand color.

## Typography

**Display Font:** Archivo variable (width axis), condensed to `font-stretch: 68%`, weight 800, all caps, with Arial Narrow and system-ui fallbacks.
**Body Font:** Archivo, weight 500, with system-ui fallback.

**Character:** A tall, tight, poster-like display face over a plain humanist-grotesque body. The contrast between the two does the hierarchy work; there are few sizes.

### Hierarchy
- **Display / Headline** (800, `clamp(30px, 6vw, 46px)`, 1.12): The one result sentence. Phone fixes it at 30px.
- **Section title** (800, 22px, 0.98): Bars panel title, form fieldset legends; group legends 17px; column headers 20px with 0.04em tracking; brand h1 24px (19px on phone).
- **Numeral** (700, 24px, tabular-nums): Math-column values; output values 30px; bar totals and phone tile totals use weight 800 at `font-stretch: 78%` (28px and 24px).
- **Body** (500, 16px, 1.45): Sub-line (max 54ch), footer (13px, max 70ch).
- **Label** (700, 13px): Form field labels. Unit text inside labels is 12px, weight 600, Ink Soft.
- **Note** (600, 12-14px, Ink Soft): Hints, math captions, table caption, to-do list.

### Named Rules
**The Condensed-Caps-For-Headings Rule.** Headings and legends use the display treatment; body, labels and numbers never do. Money always uses tabular numerals.

## Layout

A single column, max width 960px, centered, with 16px side padding (14px on phone) and a 22px vertical gap between blocks (16px on phone). Order: brand line, result, working (two math columns, bars panel, breakdown table), form, footer.

Spacing is a loose 6 / 12 / 18 / 22 / 28 rhythm: 12px between fields, 14-18px inside cards, 18px between math columns, 28px between bars. The math columns are two equal grid columns on wide screens and stack on phone. Form cards use auto-fit grids with 140px (vehicle pickers), 180px (option panels) and 200px (basics) minimum widths.

At 760px and below, the result becomes the night card with gas and EV tiles, the working block moves after the form, and the form becomes five tab-switched panels (Basics, EV, Old car, Charging, Optional) under a sticky night peek line. On wider screens all panels show and the peek line and tabs are hidden. Touch targets are at least 44px (inputs 46px, radios and checkboxes 24px with 44px rows).

## Elevation & Depth

Flat. There are no shadows. Depth is conveyed by tonal layering (Sky Cream surfaces over Sky Paper), 1px borders, and the faint grain. The only motion is a 0.2s background-color transition on the result when motion is allowed.

### Named Rules
**The Flat-On-Paper Rule.** Surfaces are separated by tone and a 1px line, never by a shadow or a thick outline.

## Shapes

Square. Every container (result, columns, bars panel, table, cards, groups, tabs, inputs, selects, amount block, bars) has `border-radius: 0` or no radius. Native radios and checkboxes keep their rounded native shape, sized 24px with the teal accent. Borders are always 1px. There are no badges, starbursts, pills or decorative shapes. Bars are plain rectangles whose height is proportional to the total.

### Named Rules
**The Square-Container Rule.** No radius on any container or control box. Native radio and checkbox glyphs are the only rounded shapes.

## Components

### Result
Sky Cream block with the display headline; the saving or extra cost sits in a flat teal block (the amount block, white text, no radius) inline in the sentence. Below it a plain sub-line with bold figures. On phone it inverts to the night card with two white-on-fill totals bordered by a 1px On Night line.

### Math columns
Two bordered cards, one per side. A solid fill header in caps display type, two rows of "value, operator, value" with small captions, and a solid fill output row with the yearly cost. Values are read-only text.

### Bars panel
Title, then two bars drawn as solid fills with the dollar total above and the label below, sitting on a 1px Line Strong axis.

### Breakdown table
Full-width table with 1px row dividers, left labels, right-aligned tabular amounts in green or red, and a total row separated by a Line Strong rule.

### Inputs / Fields
46px tall, Field White, 1px Line Strong border, no radius, 18px weight 700 text, Ink Soft placeholder. Visible label above, with unit and hint in small Ink Soft text. Focus is a 2px Cool Ink outline offset 2px on every focusable element. Disabled selects drop to 55% opacity.

### Cards and groups
Fieldsets with a Sky Cream fill, 1px Line border, a 6px-padded display legend, and 18px padding (groups nest inside with 14px padding and a 17px legend).

### Tabs (phone)
Square 44px buttons in small condensed-free caps (13px, weight 800, 0.04em). Selected tab is filled Night (Dark Teal in dark scheme) with white text; others are Sky Cream with a Line Strong border.

### Choice controls
Native radios and checkboxes, 24px, teal accent, in 44px rows with bold labels.

## Do's and Don'ts

### Do:
- **Do** put the answer sentence first and show the working directly beneath it.
- **Do** use teal for EV and peach for gas everywhere, with white text on both.
- **Do** keep every container square and every line 1px.
- **Do** use the display treatment (caps, 68% stretch, 800) for headings and legends only.
- **Do** use tabular numerals for all money and counts.
- **Do** keep personality to help text and empty states; keep labels and headings literal.
- **Do** darken a failing fill rather than switching its text to dark.

### Don't:
- **Don't** add a hero stat tile, rounded card, badge, starburst, pill or shadow.
- **Don't** use thick black outlines to separate blocks.
- **Don't** put dark text on teal, peach or night.
- **Don't** use green or red outside signed values in the table.
- **Don't** add a third saturated fill.

## Known open items

- The display face loads from the Google Fonts CDN, not self-hosted, and the file has no local fallback of the same condensed width.
- The math columns show read-only values; the approved comp showed editable inputs there.
- The comp-diff gate has not been run against the shipped build.
- White on Brick Peach measures 4.6:1 and white on Dark Teal about 5.1:1, both above the 4.5:1 minimum, but the margin on peach is thin.
- The detector reports six font sizes (11, 14, 17, 19, 20 and 28px) that appear in the Hierarchy prose but not in the typography frontmatter.
