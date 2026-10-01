# Spec Delta

## Purpose

Provide traceable asynchronous mock image generation with visible lifecycle states, reproducible failure and safe retries, while keeping input assets separate from generated results and allowing results to flow back into the canvas graph.

## ADDED Requirements

### Requirement: Traceable asynchronous lifecycle
Submitting a generator SHALL create a unique task with generator ID, input image reference, prompt snapshot, parameter snapshot, status and result reference. A task SHALL visibly pass through queued, running and succeeded using asynchronous delays. Missing inputs SHALL prevent submission with a useful explanation.

#### Scenario: Run with connected inputs
- **WHEN** the user submits a generator connected to an image and nonempty prompt
- **THEN** queued and running are visible before success, and task data retains the submitted inputs and ratio even if the canvas is later edited

### Requirement: Prevent duplicate active submissions
A generator with a queued or running task SHALL prevent another submission and visibly indicate that generation is active.

#### Scenario: Repeated click
- **WHEN** the user tries to submit again during an active task
- **THEN** no additional task is created and the interface indicates the active state

### Requirement: Reproducible failure and retry
The generator SHALL offer a one-shot “fail next generation” control. The triggered task SHALL fail with a visible reason and retain its inputs and parameters. Retrying a failed or interrupted task SHALL create a new task using the retained snapshot; the one-shot failure SHALL be consumed so a normal retry can succeed.

#### Scenario: Fail and retry
- **WHEN** the user enables failure, submits and then retries after the error
- **THEN** the original failed task is preserved and a new task succeeds with the original input snapshot and parameters

### Requirement: Independent reusable results
Each successful task SHALL create a uniquely identified image asset and an image node without overwriting the input image. The result node SHALL support connection to another generator. A fixed built-in mock image SHALL be clearly identified as a mock output.

#### Scenario: Use a result as input
- **WHEN** a task succeeds and the result is connected to a second generator
- **THEN** the second generator shows that result asset as input and the original source image still exists

### Requirement: Completion after generator deletion
Deleting a running generator SHALL clean its graph connections and safely interrupt its task. Delayed callbacks SHALL NOT create orphan results after deletion.

#### Scenario: Remove a running generator
- **WHEN** the generator is deleted while its mock task is active
- **THEN** its task becomes interrupted and no later result node appears for it
