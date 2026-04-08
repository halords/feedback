# Design System Specification: The Architectural Perspective

## 1. Overview & Creative North Star
This design system is anchored by a Creative North Star we define as **"The Precision Curator."** 

Unlike generic "modern" dashboards that rely on rigid grids and heavy borders, this system treats the digital interface like a high-end editorial publication. It balances the authoritative weight of Deep Indigo with the ethereal lightness of wide-open space. The "Precision Curator" look is achieved through **Tonal Layering**—the practice of defining hierarchy via background shifts rather than lines—and **Intentional Asymmetry**, where typography and white space are used to lead the eye through complex data sets without overwhelming the user.

By moving away from "box-and-line" layouts, we create an environment that feels sophisticated and bespoke. This isn't just an interface; it’s a high-performance workspace designed for clarity and professional prestige.

---

## 2. Colors & Surface Logic

### The "No-Line" Rule
To achieve a premium feel, **1px solid borders are strictly prohibited for structural sectioning.** Boundaries must be defined solely through background color shifts. For example, a sidebar should be rendered in `surface_container_low` against a `surface` main content area. This creates a soft, architectural division that feels integrated, not "caged."

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Use the following hierarchy to "stack" importance:
- **Base Layer:** `surface` (#f7f9fb) – The canvas for the entire application.
- **Structural Sub-sections:** `surface_container_low` (#f2f4f6) – Used for sidebars or background groupings.
- **Interactive Elements/Cards:** `surface_container_lowest` (#ffffff) – Pure white cards sitting on top of the low-tier background create a crisp, natural lift.
- **Overlays/Modals:** `surface_bright` (#f7f9fb) – To be used for high-priority floating elements.

### The "Glass & Gradient" Rule
Standard flat colors can feel sterile. For primary CTAs and high-impact hero sections, utilize a **Signature Texture**: a linear gradient from `primary` (#24389c) to `primary_container` (#3f51b5) at a 135-degree angle. For floating navigation or context menus, apply **Glassmorphism**: use `surface_container_lowest` at 80% opacity with a `24px` backdrop blur to allow the brand colors to bleed through.

---

## 3. Typography
We utilize a dual-font strategy to balance character with utility.

*   **Display & Headlines:** **Manrope** is our voice of authority. Its geometric construction feels modern yet stable. Use it for all `display` and `headline` tokens to establish a bold, editorial rhythm.
*   **Interface & Reading:** **Inter** is our workhorse. Used for `title`, `body`, and `label` tokens, it ensures maximum legibility in dense data environments.

### The Scale
- **Display-LG (Manrope, 3.5rem):** Reserved for hero impact. Use `on_surface` with `-0.02em` letter spacing.
- **Headline-MD (Manrope, 1.75rem):** The standard for section headers.
- **Body-LG (Inter, 1rem):** The default reading size. Ensure a line height of `1.6` for optimal flow.
- **Label-SM (Inter, 0.6875rem):** All-caps for metadata, with `0.05em` tracking to prevent character crowding.

---

## 4. Elevation & Depth

### The Layering Principle
Avoid "drop shadows" as a default. Instead, achieve depth by placing a `surface_container_lowest` card on a `surface_container` background. The subtle shift from `#ffffff` to `#eceef0` provides all the separation required for a clean, modern look.

### Ambient Shadows
When a component must float (e.g., a dropdown or modal), use an **Ambient Shadow**:
- `box-shadow: 0 12px 40px -12px rgba(25, 28, 30, 0.08);`
- The shadow color is a tinted version of `on_surface` (#191c1e), making it feel like a natural environmental effect rather than a gray smudge.

### The "Ghost Border" Fallback
If a border is required for accessibility (e.g., input fields), use a **Ghost Border**: the `outline_variant` (#c5c5d4) token at **20% opacity**. It should be felt, not seen.

---

## 5. Components

### Buttons: The Kinetic Core
- **Primary:** Gradient fill (`primary` to `primary_container`), `8px` (DEFAULT) corner radius. On hover, the gradient should shift slightly in brightness.
- **Secondary:** `secondary_container` fill with `on_secondary_container` text. No border.
- **Tertiary:** Pure text using `primary` color, with a subtle `surface_container_high` background appearing only on hover.

### Cards & Content Lists
**Strict Rule:** No horizontal dividers between list items. Use vertical white space (recommended `1.5rem` or `xl` padding) to separate rows. If rows must be distinguished, use alternating background tints: `surface` and `surface_container_low`.

### Data Visualization
Leverage the **Tertiary** palette for highlights. `tertiary_fixed` (#68fadd) and `tertiary` (#004c41) provide a vibrant, "innovative" contrast against the deep indigo foundations, perfect for progress bars, status dots, or trend lines.

### Input Fields
Use `surface_container_highest` (#e0e3e5) for the input background with a bottom-only "Ghost Border." This gives the input a grounded, modern "material" feel while maintaining a clean look.

---

## 6. Do's and Don'ts

### Do
- **Do** use `1.5rem` (xl) or `2rem` padding for card containers to allow the layout to "breathe."
- **Do** use `tertiary` accents for success states and "innovative" feature highlights.
- **Do** utilize `backdrop-filter: blur()` on all fixed headers to create depth during scroll.

### Don't
- **Don't** use black (#000000) for text. Always use `on_surface` (#191c1e) to maintain tonal softness.
- **Don't** use standard `1px` dividers. Separate content through white space or `surface` tier shifts.
- **Don't** use sharp corners. All interactive elements must adhere to the `0.5rem` to `1rem` (DEFAULT to lg) roundedness scale to feel approachable.
- **Don't** use high-saturation shadows. Keep them diffused, light, and tinted by the surface color.