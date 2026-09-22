# Policy: Reject Public Without Security Review
# Services marked as public (public: true) must have a security.review annotation.
package policies.catalog.reject_public_no_security

import future.keywords.in

default deny := false

deny[msg] {
    entity := input.entity
    entity.kind == "Service"
    is_public(entity)
    not has_security_review(entity)
    msg := sprintf("Service '%s' is marked as public but is missing required annotation 'security.review'", [
        entity.metadata.name,
    ])
}

is_public(entity) {
    entity.spec.public == true
}

has_security_review(entity) {
    entity.metadata.annotations["security.review"]
}
