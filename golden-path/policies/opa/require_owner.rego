# Policy: Require Owner
# All catalog entities must have an owner defined.
package policies.catalog.require_owner

import future.keywords.in

default deny := false

deny[msg] {
    entity := input.entity
    not has_owner(entity)
    msg := sprintf("Entity '%s' is missing required 'owner' field", [entity.metadata.name])
}

has_owner(entity) {
    entity.spec.owner != ""
}
