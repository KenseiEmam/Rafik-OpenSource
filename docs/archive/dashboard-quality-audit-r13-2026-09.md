# Dashboard quality correction (R13)

Owner: Codex. 23 September 2026. Implemented and accepted locally. This replaces any implication that R12's automated acceptance established an exceptional product experience.

## Evidence and causes

Inspected the current organization analytics in the running app, its data/chart components, shared shell/navigation, all timezone inputs, scheduling, daily overview, people management, and existing interaction/layout coverage. Retain Rafik's Manrope/Arabic typography, green tokens, role/ownership boundaries and URLs. This is a product-workspace redesign, not a marketing restyle.

| Finding | Cause | Correction / acceptance |
|---|---|---|
| Analytics starts with large filter forms and explanations; useful charts lie below the fold | Added trustworthy definitions without a visual information hierarchy | Compact date presets, clear metric cards, activity/delivery tabs, concise chart subtitles and detailed definitions on demand |
| Hand-built plots show only endpoints and primitive bars | Geometry checks were mistaken for readable, informative visualization | Official Unovis charts (same foundation as shadcn-vue), real axes/tooltips, accessible per-point reading/data tables, truthful empty states |
| Timezone fields require knowing IANA strings | Native datalists were treated as finished selection controls; several catalogs only had five entries | Shared Reka UI searchable combobox with full browser IANA catalog, UTC, persisted aliases, current offset labels, keyboard selection and disabled state in every timezone editor |
| Desktop behaves like a long website, with navigation and tools scrolling away | Public-page shell and spacing reused for operational tasks | Persistent desktop header/sidebar, independently scrolling main workspace, mobile navigation drawer and natural phone form scrolling |
| Scope/search changes make reports disappear; failed reload discards usable data | Initial load, refresh and pagination share a destructive state | Preserve last report during refresh/error, latest-request guard and selected-person retention |
| Hidden labels escape unpositioned scroll containers | Absolute accessibility text was outside its intended containing block | Positioned workspace/sidebar containers; desktop document-height checks, without global overflow masking |
| Browser Back loses workspace scroll | Restoration ran against the loading skeleton | Bounded observation waits for usable content, cancelled by navigation/user input; both-engine browser-back test |
| Theme affordances silently lose backgrounds | Undefined `--wash`/`--soft` tokens were not checked | Reuse `--tint`/`--surface-soft`; static owned-token definition guard |
| Calendar shows a superseded response | Older async reads could complete after a newer date/filter request | Generation guard and disabled pagination during load |
| Navigation hides important independent coach tools in More | Phone navigation restriction applied to the overall information architecture | Stable grouped navigation, including Analytics and Appointments, within authorized context |

## Acceptance scope

One Vue app, unchanged server authority and Prisma/PostgreSQL contracts. Use Unovis and Reka directly with owned Rafik components; no Tailwind/framework migration or generalized dashboard engine. Dependency sources: https://shadcn-vue.com/docs/components/chart and https://reka-ui.com/docs/components/combobox .

Acceptance covered the shared chart and picker integrations, real organization-service lifecycles, a populated analytics UI/fault fixture, empty/sparse reports, reporting presets, both analytics tabs, keyboard values and table equivalents. It exercised saved timezone selection, aliases/UTC, search/escape, scheduling and booking. Desktop scroll ownership and Back navigation, phone drawer focus, existing messages/forms/offline flows and the full rendered matrices passed after the final implementation. Direct inspection also covered custom dates and named trainee filtering at 320px. Exact results and limits are in verification.

## Integration review and acceptance corrections

- Open portal Axe review caught an unlandmarked timezone popup; the popup now has a named region. The sidebar also needs its own landmark name alongside feature asides.
- Current UTC offset labels differ by engine (`UTC+0` vs `UTC`), and browser IANA catalogs use different city aliases. Labels normalize zero, search accepts common renamed cities, and search text excludes offset labels so UTC does not match every zone.
- Safari test fills can target off-screen fields without bringing their anchor into view. Scheduling tests/audit now click the actual field before searching, matching the user interaction; no forced click or disabled actionability check is used.
- Responsive Unovis charts resize through observers. Breakpoint acceptance polls the resulting layout rather than measuring the old width in the instant after viewport mutation. Horizontal overflow detection remains strict.
- Existing mobile appearance journeys must open the new navigation drawer before using its theme selector; retaining an old footer locator is not a product regression.
- A delayed calendar read must be invalidated on unmount before it can rewrite route query parameters. The service journey now holds a real API read, navigates to Analytics, then releases it and checks the destination URL.
- Added a real Back-navigation regression because page snapshots alone do not establish workspace behavior. Scroll restoration waits for async content and yields immediately to user interaction.

## Why prior acceptance missed this

The existing suites were strongest on transactional correctness, recovery, role boundaries and clipping. They did not adequately measure information hierarchy, complete choice catalogs, meaningful chart reading, scroll ownership, open portals or cross-page restoration. A zero-overflow page can still be a poor dashboard. Acceptance now combines task journeys, open-control/plot states, geometry and direct visual inspection. Keep the underlying real-service suites: the new populated analytics mock proves presentation/recovery behavior, not database correctness. Actual human comprehension and repeat use remain unobserved; no claim of universal defect elimination is made.

## Final result

All 26 final release gates passed: 76 browser journeys and 1,120 rendered states, including the new 192-state staff dashboard matrix, plus all backend/build/maintenance checks. See [verification](../verification/README.md) and the [receipt](../verification/receipts/r13-verification.txt). Actual narrow-phone timezone selection, custom reporting dates, named trainee filtering, drawer navigation and desktop/phone messages were inspected. The preview remains local and preserved.
