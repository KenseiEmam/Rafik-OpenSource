# Rafik design system

**Status: founder approved, implementation underway, 21 October 2026.** This is the single visual and interaction specification for the web dashboard. It describes the existing foundation and the proposed standard separately. Proposed tokens and components below are not implemented merely because they appear here. Android is a follow-up audit; this document does not establish native acceptance. The [audit and rollout plan](known-issues/ui-ux-audit.md) records findings, evidence and priorities.

## Purpose and boundaries

Rafik should feel like one university sports workspace: calm, legible, practical and recognizably Rafik. Preserve the logo, green identity, existing fonts, English/Arabic support, theme customization and role-specific navigation. Improve consistency rather than introducing a different visual identity.

Visual work must preserve API contracts, routes, permissions, one-role memberships, exact commands, revision checks, recoverable drafts, immutable program versions and offline/acknowledgment distinctions. Do not move business rules into reusable form controls. No new component library, font family or global store is required.

## Existing foundation

| Area            | Current source of truth                                         | Keep                                                                               |
| --------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Theme           | `apps/frontend/src/style.css`, `src/lib/branding.ts`            | Instance-derived semantic colors, both themes and contrast-aware accent foreground |
| Fonts           | `apps/frontend/src/main.ts`                                     | Manrope Variable; Noto Sans Arabic at 400/600                                      |
| Dashboard shell | `src/App.vue`, `src/styles/dashboard.css`, workspace navigation | Role navigation, desktop workspace scroll and phone drawer                         |
| UI primitives   | Reka UI, native form controls                                   | Accessible interaction foundations; explicit direction on portaled content         |
| Icons           | `@phosphor-icons/vue`, existing local SVGs                      | SVG icons with accessible labels; original logo artwork                            |
| Feedback        | `src/lib/feedback.ts`, `PageState.vue`, `CommandStatus.vue`     | Action-specific toasts and explicit durable-write/recovery states                  |

Paths in this table are relative to `apps/frontend/` unless the full path is given. Feature layouts should consume these foundations, not compete with them.

## Color and surfaces

### Existing tokens

| Token                         | Meaning                         | Rule                                                      |
| ----------------------------- | ------------------------------- | --------------------------------------------------------- |
| `--page`                      | Application canvas              | Keep instance-configured light/dark background            |
| `--surface`                   | Raised work surface             | Forms, dialogs and meaningful grouped panels              |
| `--surface-soft`              | Subtle grouping/selection       | Restrained row emphasis, chips, secondary sections        |
| `--ink`                       | Primary content                 | Headings, field values and essential text                 |
| `--muted`                     | Secondary content               | Descriptions, timestamps and helper text; still readable  |
| `--line`                      | Borders and dividers            | One-pixel separation; not a substitute for spacing        |
| `--accent` / `--accent-hover` | Primary and selected actions    | Theme-derived Rafik green treatment                       |
| `--on-accent`                 | Text/icons on accent            | Always pair with accent backgrounds; never hardcode white |
| `--error` / `--error-bg`      | Error text/surface              | Validation and operational errors                         |
| `--radius` / `--shadow`       | Current surface shape/elevation | Consolidate usage rather than copying values              |

The original default accent is `#285943`; default page colors are `#f8f8f3` and `#171e1a`. Runtime colors can differ because installation branding and accessible theme derivation are supported. Do not replace them with fixed brand swatches throughout components.

### Proposed additions

Introduce semantic success, warning, information and danger-action foreground/background/border pairs. These are **proposed**, not existing token names. Resolve final values against both default and customized palettes during implementation. Success can use the green family; warning uses restrained amber, information a muted blue, danger a readable red. Meaning must also appear as text or an icon.

Use ordinary opaque surfaces for most content. Use a subtle gradient only for a small header, selected emphasis or onboarding highlight. Glass treatment is optional for floating shell elements/overlays, with an opaque fallback and verified contrast. Never blur a form, table, athlete record or primary reading surface.

## Typography

### Approved scale

| Purpose                              | Size                      | Weight  | English line height |
| ------------------------------------ | ------------------------- | ------- | ------------------- |
| Page title                           | 28px phone / 32px desktop | 600     | 1.2–1.3             |
| Main section heading                 | 20px                      | 600     | 1.35                |
| Panel/subsection heading             | 18px                      | 600     | 1.4                 |
| Body and field value                 | 16px                      | 400     | 1.5–1.65            |
| Dense table, label, secondary action | 14px                      | 400/600 | 1.5                 |
| Caption/metadata                     | 13px minimum              | 400     | 1.5                 |

Use `rem` implementations so browser text scaling works. Arabic body copy needs approximately 1.65 line height and headings 1.4–1.6; verify with the existing Arabic font. Do not invent unavailable Arabic font weights. Avoid English-style negative tracking on Arabic. Essential explanations must not be reduced to faint captions.

Heading level follows document structure, not desired font size. Use one page `h1`, then `h2` sections and `h3` subsections without skips. A tab label is not a heading. A proper tab panel can start with its own `h2`; do not add a redundant “Manage details” heading merely to fill a wrapper.

### Heading relationships

- Page title → description: 8px. Page header → content: 24px desktop, 20px phone.
- Section/panel title → description: 8px. Header group → fields/content: 16px.
- Field label → control: 8px. Control → helper/error: 4–8px.
- A title and description are one header group. Do not let grid row distribution or generic paragraph padding separate them.

For **Primary coach**, keep the heading, short responsibility explanation and selection controls together. Do not give the description generic `:only-of-type` padding or stretch its header rows to match another card's height.

## Spacing, shape and elevation

Approved spacing scale: **4, 8, 12, 16, 20, 24, 32, 48, 64px**. Use 24px panel padding on desktop, 16px on phone; 16px nested section spacing; 24–32px between independent sections. Dense rows can use 12px vertical and 16px inline padding.

Approved radii: 8px controls, 12px panels/dialogs, full pill only for compact tags/toggles where the shape helps recognition. Border thickness is normally 1px. Reserve stronger borders for selection, focus or an explicit warning. Use at most one restrained shadow on a floating/raised element; routine data panels do not each need a shadow.

Implementation should introduce named spacing, typography, radius, control-size, motion and elevation tokens in the existing style foundation. The implemented token names are in `styles/design-system.css`; the scale includes only the values currently consumed. Do not publish a second parallel theme system.

## Layout and information patterns

| Content/task                                   | Preferred presentation                                | Avoid                                                                          |
| ---------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------ |
| Role directory with repeated comparable fields | Desktop rows/table-like list; responsive stacked rows | A large independent card for every short value                                 |
| Program/exercise discovery                     | Existing image/content grid                           | Converting visual discovery into a dense table without a task reason           |
| Athlete details                                | True tab panels with coherent sections                | Anchor tabs, everything visible at once, unnecessary wrapper panels            |
| Editing identity/permissions                   | One labelled form section                             | A card inside a card around every input                                        |
| Primary/supporting coaching responsibility     | Clear section headers and scoped selection            | Equal visual emphasis for helper text and the action                           |
| Sports versus specialties                      | Two clearly named groups with counts and row actions  | An unstructured mixed label pile or long horizontal form at phone width        |
| Analytics                                      | Labelled chart plus readable table/summary            | Invented ratings, unlabeled axes, empty axes presented as real activity        |
| Settings                                       | Related groups in a responsive grid                   | Arbitrary half-width empty page, equal-height cards filled with stretched gaps |

Cards indicate a meaningful surface or task boundary. Inside a card, use spacing or a divider for subordinate groups. Equal-width columns do not imply that every card must have the same content height. Align top edges, keep headers compact and avoid distributing empty space between form fields.

### Containers and breakpoints

Keep the existing 1500px maximum operational workspace and its sidebar boundary. Proposed gutters: 16px phone, 24px tablet/desktop. Use a readable 720–800px column for a single long form and roughly 65–75 characters for prose. Authentication forms stay centered at approximately 440–480px. Wide editing/reporting tasks may use the full operational width.

Breakpoints are content-driven. Review at **320×640, 390×844, 768×1024, 1024×768 and 1440×1000**. Do not create one breakpoint for every component. Two-column settings become one column when labels/controls cannot fit comfortably. Use `minmax(0, 1fr)`, appropriate intrinsic minimums and logical gaps; remove obsolete conflicting rules.

Page headings, filters, tabs and pagination share the same container edges. Desktop tabs/pagination align on their bottom edge; phone controls wrap in reading order. Keep the existing conventions: People/session/event/nutrition/service lists use 10 rows; program/plan/exercise grids keep their approved defaults. Member selection can retain incremental loading with durable selected IDs.

Desktop workspace scrolling and conversation-thread scrolling have different owners. A form should scroll naturally; an open conversation may have a bounded history. Never hide document overflow globally to mask clipping.

## Components and interactions

### Buttons and icons

Use one primary action per task group, secondary outlined actions, and quiet text/icon actions for low emphasis. Danger styling is for destructive access/data actions, never routine cancellation. Preserve icon-plus-text for ambiguous operations; icon-only actions need an accessible name, visible focus and tooltip where useful.

Use consistent 18–20px SVG icons inside controls. Mirror only directional arrows/chevrons in RTL, never logos, media, numerals or all icons indiscriminately. Proposed default control height is 44–48px; compact desktop actions may be 36px where an adjacent touch-safe path exists. Routine mobile actions should have at least a 44×44px hit area.

### Inputs and selections

Keep native text/date/time inputs unless a real interaction problem justifies an accessible existing primitive. Prefer a reusable field wrapper for label/help/error spacing; it must pass through IDs, autocomplete, input mode, native constraints and focus. Error text is linked with `aria-describedby`; invalid controls use `aria-invalid` after validation.

| Choice                                 | Standard                                                                                                 |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| One of a few mutually exclusive values | Radio group, optionally styled as segmented buttons; one choice, keyboard arrows, never multiple toggles |
| Several independent values             | Checkboxes with visible checked state                                                                    |
| A binary ongoing setting               | Switch only when “on/off” is the actual meaning; state that saving is required when it is                |
| Long one-value list                    | Searchable existing combobox or labelled native select                                                   |
| Many people/items                      | Search, meaningful option details, persistent selected chips and clear removal                           |

Person selections must search the entire authorized roster, resolve names across pages and retain selections through filtering/reload. Show sports/specialties and primary/supporting responsibility where relevant. Filtered out is not deselected. Clear unavailable selections explicitly; never silently submit hidden IDs.

Search behavior must be explicit: a labelled Search action/Enter when results are server submitted; no mix of delayed and submit-only behavior without a reason. New search/filter resets list page; opening/returning from a record preserves the previous query and page. Preserve previous results during refresh with a clear busy state; accept only the latest response.

### Password visibility

**Proposed shared improvement:** add a labelled show/hide password button to sign-in, first setup, invitation and password-setup fields. It changes only `type`, not the value, validation, submission, autocomplete or password policy. Use `type="button"`, an SVG eye/eye-off icon, localized accessible names and a visible pressed/state treatment. Reveal state is local and never persisted or logged. Confirm-password controls need independent names; toggling must not clear either field or submit the form.

### Focus, motion and state

- Keep a clearly visible focus ring with approximately 2–3px outline and offset. Do not remove it for keyboard users or clip it inside a scroll container.
- Proposed motion: 150ms for color/focus feedback, 180–200ms for disclosure/overlays, consistent ease-out. No bounce, long entrance sequences or motion required to understand state.
- Under `prefers-reduced-motion`, remove spatial transitions and nonessential animation; retain text/progress meaning without animation.
- Every component needs default, hover, focus-visible, selected, disabled, busy and error treatments. Disabled must not masquerade as empty or unavailable data.
- Loading buttons keep a useful label and stable width. Durable saving, sending, uncertain acknowledgment and acknowledged success remain distinct.

### Navigation, tabs and dialogs

Keep role-specific staff navigation visible on desktop and discoverable in the phone drawer. Do not reintroduce role-switching or legacy standalone coach navigation. Use breadcrumbs/back links for location, tabs for same-record panels, and sidebar links for separate tasks.

Use existing Reka tab/dialog primitives when appropriate. Dialogs have a title, optional concise description, focus containment, safe initial focus, Escape/cancel behavior and focus return. Destructive confirmation should not initially focus the destructive action. Long dialogs scroll internally within viewport padding and keep actions reachable at short heights. Portaled content needs explicit locale direction.

Institution closure stays a red entry action followed by an exact-name confirmation dialog. Explain impact and record preservation, retain server name/revision checks, and display failures inside the dialog. A pending/uncertain command cannot become an independent new retry just because the modal closes.

### Feedback and state surfaces

Use action-specific success copy, such as “Membership updated”, with the existing short toast lifetime. Messages, checkbox changes and ordinary navigation that already show their result do not need success toasts. Errors need durable inline context and recovery; a five-second error toast alone is insufficient.

Use a skeleton for first load, a small busy indicator for refresh and a useful bounded empty state. Empty states answer: what belongs here, why it is empty if known, and the next permitted action. A filtered no-match state offers clear/reset; an authorization refusal is not an empty list. Only constrain width when the state is centered or inside a bounded reading column.

## English, Arabic and accessibility

Preserve current localization helpers and keys; this project does not need a new localization framework for design standardization. Prefer `margin-inline`, `padding-inline`, `inset-inline`, `text-align: start` and logical layout. Give portaled popups their own direction. Use `dir="auto"` for untranslated names and controlled LTR spans for email, URLs and numeric ranges where needed.

Arabic length and line height can change row/card height. Do not force one-line Arabic labels or use font-size reduction as a layout repair. Test mixed Arabic/English names, long sports/specialty labels and live resizing. Keep DOM/keyboard order aligned with visual order rather than moving whole form sections using CSS `order`.

Target WCAG 2.2 AA behavior: 4.5:1 normal text, 3:1 large text and meaningful control/focus boundaries, semantic labels, keyboard operation, visible focus and reflow at narrow widths/zoom. Automated scans are supporting evidence; they cannot establish understandable copy, correct RTL orientation or complete keyboard usability.

## Rollout and acceptance

1. Approve this document and the [prioritized plan](known-issues/ui-ux-audit.md).
2. Introduce small shared token/component changes in reviewable slices; keep compatibility styles while migrating named consumers.
3. Apply them first to People, athlete management and institution settings, then the remaining workflow families.
4. Capture baseline and changed screenshots of real authorized data, long labels, empty/search/error and open-control states.
5. Run the smallest relevant interaction checks, both engines for shared control changes, and the representative locale/theme/viewport matrix. Inspect the images, not just scan results.
6. Update this document, audit status, maintained docs and actual verification evidence in the same change. Coordinate public workflow documentation in English/Arabic after implementation is approved.

**Approved rollout:** the founder approved these guidelines and implementation on 21 October. Preserve existing product behavior and security boundaries throughout the remaining slices. Shared presentation tokens now live in `apps/frontend/src/styles/design-system.css`; `SectionHeader.vue` and `PasswordField.vue` establish reusable section and password controls. Remaining view migrations are tracked in the audit report.
