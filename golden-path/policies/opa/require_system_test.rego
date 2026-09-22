package policies.catalog.require_system

test_deny_component_without_system {
    input := {
        "entity": {
            "metadata": {"name": "my-component"},
            "kind": "Component",
            "spec": {}
        }
    }
    deny with input as input
}

test_deny_service_without_system {
    input := {
        "entity": {
            "metadata": {"name": "my-service"},
            "kind": "Service",
            "spec": {}
        }
    }
    deny with input as input
}

test_allow_component_with_system {
    input := {
        "entity": {
            "metadata": {"name": "my-component"},
            "kind": "Component",
            "spec": {"system": "payment-system"}
        }
    }
    not deny with input as input
}

test_allow_service_with_system {
    input := {
        "entity": {
            "metadata": {"name": "my-service"},
            "kind": "Service",
            "spec": {"system": "order-system"}
        }
    }
    not deny with input as input
}

test_allow_non_component_service_entity {
    input := {
        "entity": {
            "metadata": {"name": "my-api"},
            "kind": "API",
            "spec": {}
        }
    }
    not deny with input as input
}

test_deny_component_with_empty_system {
    input := {
        "entity": {
            "metadata": {"name": "my-component"},
            "kind": "Component",
            "spec": {"system": ""}
        }
    }
    deny with input as input
}
