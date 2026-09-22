# Policy: Require Data Classification
# All Service entities must have a data.classification annotation.
package policies.catalog.require_data_classification

import future.keywords.in

default deny := false

deny[msg] {
    entity := input.entity
    entity.kind == "Service"
    not has_data_classification(entity)
    msg := sprintf("Service '%s' is missing required annotation 'data.classification'", [
        entity.metadata.name,
    ])
}

has_data_classification(entity) {
    entity.metadata.annotations["data.classification"]
}
