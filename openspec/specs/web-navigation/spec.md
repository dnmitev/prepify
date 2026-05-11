# web-navigation Specification

## Purpose

Define how the Prepify web application exposes **persistent, accessible primary navigation** so users can reach core destinations from any standard page.

## Requirements

### Requirement: Persistent primary navigation on all web pages

The Prepify **web application** SHALL render a **shared navigation region** on every standard page view (via the root or equivalent layout) so users can reach core destinations without relying only on in-page ad-hoc links. The navigation SHALL be exposed as a **single** navigational landmark (for example a `nav` element with an accessible label) and SHALL include links to **Home**, **Practice** (exam intro), **Attempt history**, **Admin jobs**, and **Experimental** routes as defined in implementation.

#### Scenario: Navigation visible from home

- **WHEN** a user opens the **home** route in the web app
- **THEN** the shared navigation is visible and includes operable links to the **Practice**, **Attempt history**, **Admin jobs**, and **Experimental** destinations

#### Scenario: Navigation visible from nested routes

- **WHEN** a user opens a nested route such as **attempt history** or an **attempt in progress**
- **THEN** the same shared navigation remains available without requiring navigation back through the home page only

### Requirement: Accessible navigation semantics

The shared navigation SHALL use **clear link text** that describes each destination. The current page’s corresponding nav link SHOULD be programmatically indicated when technically feasible (for example `aria-current="page"` on the active link) to assist screen-reader users and visual orientation.

#### Scenario: Keyboard users can reach nav links

- **WHEN** a user moves focus through the page using standard keyboard tab order
- **THEN** each navigation link is focusable and activates with standard keyboard interaction (Enter) like other links
