# Design brief — rentr-connect

## Direction and scope

**Committed direction: Quiet Blueprint**, adapted from the original starter scaffold to a direct-rental marketplace prototype. The interface should feel calm and trustworthy while remaining explicit that listing, request, chat, and profile data are mock previews.

## Design dimensions

- **Design movement:** Contemporary Swiss-influenced utility design, softened for a real-estate browsing experience.
- **Core principles:** Clear hierarchy, trustworthy property details, restrained color, and predictable navigation.
- **Color philosophy:** Cool neutral canvas and dark slate text, with the existing cobalt accent used for links and primary actions. Avoid gradients and oversized decorative color blocks.
- **Layout paradigm:** A responsive app shell with compact navigation, an airy property grid, a two-column detail view, and focused form/chat columns. Keep screens scannable rather than dense.
- **Signature elements:** The existing geometric connection mark; consistent neighborhood/location labels; simple outlined panels for metadata, forms, and conversation context.
- **Interaction philosophy:** Normal route navigation plus local client-only preview state for forms, request actions, and chat. No real API calls or persistence are implied.
- **Animation:** Keep motion minimal; use only subtle hover/focus transitions already present in the UI atoms.
- **Typography system:** System sans-serif stack with plain weight hierarchy and comfortable line height; no external font dependency.
- **Brand essence:** A dependable, direct way for renters and owners to connect around a home.
- **Brand voice:** Direct, calm, and human. Example: “Find a place that feels like home.” / “Public locations stay approximate while you explore.”
- **Wordmark/logo:** Keep the plain-text “rentr-connect” wordmark and the existing flat connection symbol.
- **Signature brand color:** Cobalt blue, used sparingly against a white/light-neutral canvas.

## Asset scope

Use a small set of locally bundled, illustrative property photographs only to make the mock listing/detail pages legible. Track their search-result sources in `ASSET_SOURCES.md`; replace or license-check them before using the prototype as a commercial listing service. No custom hero or decorative illustration is needed. English only for this prompt; RTL and localization remain out of scope.
