# Policy: Require Lifecycle
# All catalog entities must have a lifecycle field restricted to allowed values.
package policies.catalog.require_lifecycle

import future.keywords.in

default deny := false

allowed_lifecycles := {"experimental", "production", "deprecated"}

deny[msg] {
    entity := input.entity
    not has_lifecycle(entity)
    msg := sprintf("Entity '%s' is missing required 'lifecycle' field", [entity.metadata.name])
}

deny[msg] {
    entity := input.entity
    lifecycle := entity.spec.lifecycle
    not lifecycle in allowed_lifecycles
    msg := sprintf("Entity '%s' has invalid lifecycle '%s'. Allowed values: %s", [
        entity.metadata.name,
        lifecycle,
        concat(", ", allowed_lifecycles),
    ])
}

has_lifecycle(entity) {
    entity.spec.lifecycle != ""
}
