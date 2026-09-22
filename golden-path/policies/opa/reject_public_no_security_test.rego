package policies.catalog.reject_public_no_security

test_deny_public_service_without_security_review {
    input := {
        "entity": {
            "metadata": {
                "name": "my-service",
                "annotations": {}
            },
            "kind": "Service",
            "spec": {"public": true}
        }
    }
    deny with input as input
}

test_allow_public_service_with_security_review {
    input := {
        "entity": {
            "metadata": {
                "name": "my-service",
                "annotations": {
                    "security.review": "approved"
                }
            },
            "kind": "Service",
            "spec": {"public": true}
        }
    }
    not deny with input as input
}

test_allow_private_service_without_security_review {
    input := {
        "entity": {
            "metadata": {
                "name": "my-service",
                "annotations": {}
            },
            "kind": "Service",
            "spec": {"public": false}
        }
    }
    not deny with input as input
}

test_allow_non_service_public {
    input := {
        "entity": {
            "metadata": {
                "name": "my-component",
                "annotations": {}
            },
            "kind": "Component",
            "spec": {"public": true}
        }
    }
    not deny with input as input
}

test_deny_public_service_with_no_annotations {
    input := {
        "entity": {
            "metadata": {
                "name": "my-service"
            },
            "kind": "Service",
            "spec": {"public": true}
        }
    }
    deny with input as input
}
