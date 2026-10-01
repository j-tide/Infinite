# Spec Delta

## Purpose

Provide an editable image creation workspace in which users build a directed graph from image, prompt, and generator nodes, navigate a stable world coordinate system, and remove content without dangling connections.

## ADDED Requirements

### Requirement: Create and edit typed nodes
The application SHALL start with an empty canvas and allow creating image, prompt, and generator nodes from the interface. Each node MUST have a stable ID, type and world position. Images SHALL use recoverable built-in resources, prompts SHALL be editable, and generators SHALL expose an aspect-ratio parameter and their current connected inputs.

#### Scenario: Build a workspace from the interface
- **WHEN** the user adds a built-in image, a prompt and a generator and edits the prompt and ratio
- **THEN** three independent typed nodes appear and retain the entered content and ratio

### Requirement: Stable canvas navigation
The application SHALL offer discoverable panning, pointer-centered wheel zoom and scale-correct node dragging. Clicking blank canvas SHALL clear selection.

#### Scenario: Move after zooming
- **WHEN** the user zooms around the pointer, pans and drags a node
- **THEN** the point under the zoom pointer stays anchored and node movement matches the current scale without changing other nodes' world positions

#### Scenario: Clear selection
- **WHEN** the user clicks empty canvas
- **THEN** previously selected nodes and connections are deselected

### Requirement: Directed typed input connections
The application SHALL allow creating and deleting directed image-to-generator and prompt-to-generator connections. Generators SHALL show live connected image and prompt content. Wrong-type, self and duplicate connections SHALL be rejected with no graph mutation. Each generator SHALL accept at most one input of each type.

#### Scenario: Connect and update inputs
- **WHEN** the user connects an image and prompt to their generator inputs and then edits the prompt
- **THEN** the generator shows the current image and updated prompt

#### Scenario: Remove a connection
- **WHEN** the user selects a connection and deletes it
- **THEN** that input disappears from the generator while its source node remains

### Requirement: Safe node deletion
Deleting a node SHALL remove all its incoming and outgoing connections. Historical task input snapshots and referenced assets SHALL remain available independently of node lifetime.

#### Scenario: Delete a connected node
- **WHEN** the user deletes a source node
- **THEN** all associated connections disappear and remaining generators show no dangling input

### Requirement: Runnable and explainable demo
The demo MUST include an explicit startup command, dependency manifest and lockfile, a README covering dependencies, decisions, verification and limitations, and a truthful record of relevant AI assistance. It SHALL support the documented 3–5 minute P0 demonstration.

#### Scenario: Run a submitted checkout
- **WHEN** dependencies are installed using the lockfile and the documented startup command runs
- **THEN** the application opens and the documented creation, generation and refresh path is available without credentials
