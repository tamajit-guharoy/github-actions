def process_order(items):
    """Calculate the total for a list of items."""
    return sum(item["price"] * item["quantity"] for item in items)

def validate_email(email):
    """Basic email validation."""
    return "@" in email and "." in email.split("@")[1]
