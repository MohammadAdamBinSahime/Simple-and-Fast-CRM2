# CRM Application Design Guidelines
**Inspired by TwentyCRM's Notion-like Interface**

## Design Approach

**Selected Approach:** Design System with Notion/Linear-inspired principles

**Justification:** This is a utility-focused, information-dense productivity tool where efficiency and learnability are paramount. The interface requires consistent, proven UI patterns for data tables, forms, and navigation. Drawing from Notion's clean aesthetic and Linear's precision creates an optimal foundation for this CRM.

**Core Principles:**
- Minimal, distraction-free interface prioritizing content over chrome
- Keyboard-first interactions with visible shortcuts
- Fast perceived performance through instant feedback
- Consistency across all data views and modals

## Typography System

**Font Families:**
- Primary: Inter (via Google Fonts CDN) - all UI elements, body text
- Monospace: JetBrains Mono - data fields, IDs, timestamps

**Hierarchy:**
- Page Titles: text-2xl font-semibold
- Section Headers: text-lg font-medium
- Card/Record Titles: text-base font-medium
- Body Text: text-sm font-normal
- Labels/Meta: text-xs font-medium uppercase tracking-wide
- Data Values: text-sm font-normal

## Layout System

**Spacing Primitives:** Use Tailwind units of **2, 4, 6, and 8** consistently
- Tight spacing (within components): p-2, gap-2
- Standard spacing (between elements): p-4, gap-4, my-6
- Section spacing: p-6, py-8
- Page padding: p-8

**Grid System:**
- Main layout: Sidebar (240px fixed) + Content (flex-1)
- Dashboard metrics: grid-cols-1 md:grid-cols-4 gap-4
- Table views: Full-width responsive tables
- Kanban columns: grid with auto-fit columns, min-w-80

## Component Library

### Navigation & Layout

**Top Navigation Bar:**
- Fixed height: h-14
- Contains: Logo, global search bar (Cmd+K trigger), user avatar
- Border bottom for separation
- Horizontal padding: px-6

**Sidebar:**
- Fixed width: w-60
- Sections: Main navigation, Views, Settings
- Navigation items: px-4 py-2 with hover states
- Active state indicated with subtle background
- Collapsible sections with chevron icons

**Page Container:**
- Max-width: max-w-full (no constraint for data-dense views)
- Padding: p-8
- Background: Base background color (no specification)

### Data Display Components

**Table View:**
- Sticky header row with sortable columns
- Row height: h-12 for comfortable scanning
- Cell padding: px-4 py-3
- Checkbox column (w-10) for bulk selection
- Hover state on rows for editability indication
- Inline editing: Click cell to edit with input field
- Column widths: Auto-sizing with min-width constraints
- Pagination or infinite scroll footer

**Kanban Board:**
- Column width: min-w-80 max-w-96
- Card spacing: gap-3 between cards
- Column header: Sticky with count badge, p-4
- Add card button at column bottom
- Drag handle icon on cards for reordering

**Card Component (for contacts, companies, deals):**
- Rounded corners: rounded-lg
- Padding: p-4
- Border: Subtle 1px border
- Hover: Lift effect with shadow
- Header: Title + status badge
- Body: Key-value pairs with labels in text-xs
- Footer: Action buttons or metadata (text-xs)

### Forms & Inputs

**Input Fields:**
- Height: h-10
- Padding: px-3
- Border: 1px border with rounded corners (rounded-md)
- Focus state: Ring outline
- Labels: text-sm font-medium mb-2 above inputs
- Helper text: text-xs below inputs

**Select Dropdowns:**
- Match input styling (h-10, px-3)
- Chevron-down icon on right
- Dropdown menu: rounded-lg shadow-lg with max-h-60 overflow-auto
- Options: px-3 py-2 hover states

**Textarea:**
- Min-height: min-h-24
- Padding: p-3
- Resizable vertically

**Button Hierarchy:**
- Primary action: px-4 py-2 rounded-md font-medium
- Secondary action: px-4 py-2 rounded-md with border
- Icon buttons: p-2 rounded-md (square)
- Small buttons: px-3 py-1.5 text-sm

### Modals & Drawers

**Modal (for create/edit forms):**
- Max-width: max-w-2xl
- Padding: p-6
- Backdrop: Overlay with backdrop-blur-sm
- Header: text-lg font-semibold mb-4
- Footer: Flex justify-end gap-2 with action buttons

**Slide-out Panel (for detail views):**
- Width: w-96 or w-[32rem] for detailed views
- Slides from right
- Contains: Header (sticky), scrollable content, footer (sticky)
- Padding: p-6

### Dashboard Elements

**Metric Cards:**
- Grid layout: grid-cols-1 md:grid-cols-4 gap-4
- Card padding: p-6
- Rounded: rounded-lg with border
- Structure: Label (text-xs font-medium) + Value (text-3xl font-semibold) + Trend indicator

**Quick Search Bar (Cmd+K):**
- Centered modal: max-w-2xl
- Input: Large (h-12) with icon prefix
- Results: List below with keyboard navigation support
- Recent searches section
- Category labels for different record types

### Status & Badges

**Status Badges:**
- Padding: px-2 py-1
- Rounded: rounded-full
- Text: text-xs font-medium
- Inline-flex with optional dot indicator

**Pipeline Stage Indicators:**
- Horizontal progress bar showing deal stages
- Current stage highlighted
- Compact representation in table rows

### Notes & Tasks

**Note Editor:**
- Rich text area with formatting toolbar (sticky top)
- Toolbar: text-sm buttons with icon + label
- Editor padding: p-4
- Min-height: min-h-40

**Task List:**
- Checkbox + task text + metadata (due date, assignee)
- Row height: h-10
- Strikethrough completed tasks
- Expandable for task details

## Interaction Patterns

**Keyboard Shortcuts:**
- Display shortcuts as badges: kbd element styling (px-2 py-1 rounded text-xs font-mono border)
- Common shortcuts visible in tooltips and menus

**Drag and Drop:**
- Visual feedback: Opacity change on dragged item, drop zone indication
- Smooth animations: transition-all duration-200

**Loading States:**
- Skeleton screens matching component structure
- Inline spinners for button actions

## Spacing & Rhythm

**Vertical Rhythm:**
- Form field groups: space-y-4
- Section separation: space-y-6
- Major page sections: space-y-8

**Horizontal Layout:**
- Form layouts: Two-column grid (grid-cols-2 gap-4) for compact forms
- Detail views: Single column (max-w-2xl) for readability

## Animations

**Use Sparingly:**
- Modal/drawer entrance: slide-in with duration-300
- Hover states: Subtle scale or opacity changes (transition-all duration-150)
- Loading: Pulse animation for skeletons
- No unnecessary scroll-triggered or continuous animations

## Icons

**Icon Library:** Heroicons (via CDN)
- Size: 16px (w-4 h-4) for inline icons, 20px (w-5 h-5) for buttons
- Stroke width: Match Heroicons default (1.5)
- Placement: Consistent left or right positioning based on context

## Responsive Behavior

**Breakpoints:**
- Mobile (base): Single column, stacked navigation, simplified tables
- Tablet (md): Two-column layouts, sidebar remains
- Desktop (lg+): Full multi-column grids, expanded table views

**Mobile Adaptations:**
- Sidebar becomes slide-out drawer
- Tables convert to card list view
- Reduce padding (p-4 instead of p-8 on pages)

---

**No Images Required:** This is a data-centric application. Focus on clean, functional layouts without hero imagery or decorative graphics.