package policies.catalog.require_lifecycle

test_deny_entity_without_lifecycle {
    input := {
        "entity": {
            "metadata": {"name": "my-service"},
            "spec": {}
        }
    }
    deny with input as input
}

test_allow_experimental_lifecycle {
    input := {
        "entity": {
            "metadata": {"name": "my-service"},
            "spec": {"lifecycle": "experimental"}
        }
    }
    not deny with input as input
}

test_allow_production_lifecycle {
    input := {
        "entity": {
            "metadata": {"name": "my-service"},
            "spec": {"lifecycle": "production"}
        }
    }
    not deny with input as input
}

test_allow_deprecated_lifecycle {
    input := {
        "entity": {
            "metadata": {"name": "my-service"},
            "spec": {"lifecycle": "deprecated"}
        }
    }
    not deny with input as input
}

test_deny_invalid_lifecycle {
    input := {
        "entity": {
            "metadata": {"name": "my-service"},
            "spec": {"lifecycle": "beta"}
        }
    }
    deny with input as input
}

test_deny_empty_lifecycle {
    input := {
        "entity": {
            "metadata": {"name": "my-service"},
            "spec": {"lifecycle": ""}
        }
    }
    deny with input as input
}
