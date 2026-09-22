# Policy: Require System
# All Component and Service entities must have a system defined.
package policies.catalog.require_system

import future.keywords.in

default deny := false

deny[msg] {
    entity := input.entity
    is_component_or_service(entity)
    not has_system(entity)
    msg := sprintf("Entity '%s' of kind '%s' is missing required 'system' field", [
        entity.metadata.name,
        entity.kind,
    ])
}

is_component_or_service(entity) {
    entity.kind == "Component"
}

is_component_or_service(entity) {
    entity.kind == "Service"
}

has_system(entity) {
    entity.spec.system != ""
}
