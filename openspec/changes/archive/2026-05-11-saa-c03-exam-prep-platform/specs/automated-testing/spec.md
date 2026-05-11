## ADDED Requirements

### Requirement: Unit tests for deterministic logic

The system development process SHALL include **automated unit tests** for pure and deterministic modules—especially **question validation**, **scoring and scaled-score approximation**, **exam-rule helpers** (counts, time bounds), and **LLM output schema validation**—such that tests run **without** network calls to external AI providers and **without** requiring Temporal or Playwright.

#### Scenario: Scoring unit tests pass offline

- **WHEN** a contributor runs the workspace unit test command with no `DATABASE_URL` and no API keys
- **THEN** tests covering scoring and validation helpers execute successfully

### Requirement: API or persistence tests where behavior is contract-critical

The system SHALL include **integration-style tests** for HTTP API behavior that depends on PostgreSQL (e.g., starting an attempt, saving answers, finalizing scores) using either **Testcontainers**, a **CI-managed Postgres service**, or documented **docker-compose test** profile so migrations and queries are exercised under realistic conditions.

#### Scenario: Critical API paths covered against a real database

- **WHEN** integration tests run in CI with a PostgreSQL instance available
- **THEN** at least one test proves attempt lifecycle and persisted scoring outcomes for a seeded **SAA-C03** configuration

### Requirement: End-to-end UI tests with Playwright

The repository SHALL include **Playwright** end-to-end tests targeting the **Next.js** application that validate **primary user journeys** (e.g., landing/instructions, opening a practice flow against test fixtures, viewing results or error states) using a **configurable base URL** suitable for local Compose and CI.

#### Scenario: Playwright runs against local stack

- **WHEN** the web app and API are reachable at URLs defined by environment (e.g., `PLAYWRIGHT_BASE_URL`)
- **THEN** `playwright test` completes successfully using browsers installed via the documented Playwright CLI setup

### Requirement: CI pipeline invokes automated tests

Continuous integration SHALL execute **lint**, **unit tests**, and **integration tests** on each change; Playwright E2E MAY run on every push or on a scheduled/nightly job if full-stack startup cost is high, but the repository SHALL document when E2E runs and how to reproduce locally.

#### Scenario: Contributor sees test instructions in repo

- **WHEN** a new contributor reads testing documentation
- **THEN** they find commands for unit tests, optional DB-backed tests, and Playwright, including browser installation steps

### Requirement: Tests must not embed secrets

Test configuration SHALL use **fixtures**, **mock providers**, or ephemeral credentials supplied by CI secrets—not committed API keys or production URLs.

#### Scenario: Clone-safe test defaults

- **WHEN** the repository is cloned without any `.env` file
- **THEN** unit tests still pass; integration and E2E tests either skip with a clear message or use local defaults documented for developers
