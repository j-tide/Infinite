# Spec Delta

## Purpose

Preserve a single local canvas across reloads, including its world positions, navigation state, graph references, built-in image assets and historical task outcomes, with an explicit version and safe recovery of unfinished work.

## ADDED Requirements

### Requirement: Versioned local save and restore
The application SHALL automatically save a versioned document containing nodes, positions, connections, viewport, assets and tasks. Built-in images SHALL use stable resource paths. A reload SHALL restore the saved document and viewport without an automatic viewport reset.

#### Scenario: Reload a completed canvas
- **WHEN** the user edits nodes, pans, zooms, completes generation and reloads
- **THEN** the same IDs, positions, connections, viewport, result assets and task outcomes are restored

### Requirement: Recover unfinished tasks as interrupted
Restoration SHALL convert queued and running tasks to interrupted with a visible explanation and retained inputs and parameters. It SHALL offer retry when the owning generator exists and SHALL NOT leave a task indefinitely active.

#### Scenario: Refresh during generation
- **WHEN** the user reloads while a task is queued or running
- **THEN** the generator shows an interrupted, retryable task with its original snapshot and can start a new attempt

### Requirement: Persistence failures are observable
Unavailable storage, invalid data or unsupported versions SHALL produce a visible explanation without falsely claiming the current canvas was saved. Invalid saved data SHALL be retained for diagnosis rather than silently overwritten. Restored graph references SHALL be validated.

#### Scenario: Invalid saved data
- **WHEN** the stored document cannot be safely restored
- **THEN** the application remains usable with an empty working canvas, warns the user and preserves the original stored value until an explicit recovery action
