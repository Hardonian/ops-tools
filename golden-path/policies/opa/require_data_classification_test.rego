package policies.catalog.require_data_classification

test_deny_service_without_data_classification {
    input := {
        "entity": {
            "metadata": {
                "name": "my-service",
                "annotations": {}
            },
            "kind": "Service",
            "spec": {}
        }
    }
    deny with input as input
}

test_allow_service_with_data_classification {
    input := {
        "entity": {
            "metadata": {
                "name": "my-service",
                "annotations": {
                    "data.classification": "internal"
                }
            },
            "kind": "Service",
            "spec": {}
        }
    }
    not deny with input as input
}

test_allow_non_service_without_data_classification {
    input := {
        "entity": {
            "metadata": {
                "name": "my-component",
                "annotations": {}
            },
            "kind": "Component",
            "spec": {}
        }
    }
    not deny with input as input
}

test_deny_service_with_no_annotations {
    input := {
        "entity": {
            "metadata": {
                "name": "my-service"
            },
            "kind": "Service",
            "spec": {}
        }
    }
    deny with input as input
}
