from src.api import process_order, validate_email


class TestProcessOrder:
    def test_single_item(self):
        items = [{"price": 10.0, "quantity": 2}]
        assert process_order(items) == 20.0

    def test_multiple_items(self):
        items = [
            {"price": 10.0, "quantity": 2},
            {"price": 5.0, "quantity": 3},
        ]
        assert process_order(items) == 35.0

    def test_empty_order(self):
        assert process_order([]) == 0


class TestValidateEmail:
    def test_valid_email(self):
        assert validate_email("user@example.com") is True

    def test_invalid_no_at(self):
        assert validate_email("userexample.com") is False

    def test_invalid_no_dot(self):
        assert validate_email("user@examplecom") is False
