package policies.catalog.require_owner

test_deny_entity_without_owner {
    input := {
        "entity": {
            "metadata": {"name": "my-service"},
            "spec": {}
        }
    }
    deny with input as input
}

test_allow_entity_with_owner {
    input := {
        "entity": {
            "metadata": {"name": "my-service"},
            "spec": {"owner": "team-platform"}
        }
    }
    not deny with input as input
}

test_deny_entity_with_empty_owner {
    input := {
        "entity": {
            "metadata": {"name": "my-service"},
            "spec": {"owner": ""}
        }
    }
    deny with input as input
}
