"""Regression coverage for the isolated Academe API email brand adapter."""

from unittest.mock import patch

from src.db.users import UserRead
from src.services.email.academe_brand import EMAIL_HELP_URL, EMAIL_LOGO_HTML
from src.services.users.emails import send_account_creation_email


def test_brand_defaults_use_academe_public_assets():
    assert EMAIL_HELP_URL == "https://academe.metacognix.xyz/"
    assert 'src="https://academe.metacognix.xyz/lrn.svg"' in EMAIL_LOGO_HTML
    assert 'alt="Academe"' in EMAIL_LOGO_HTML


def test_orgless_welcome_renders_academe_logo_and_help_link():
    user = UserRead(
        id=1,
        username="Martin",
        first_name="Martin",
        last_name="Hsu",
        email="martin@example.com",
        user_uuid="user_uuid",
        email_verified=True,
        avatar_image="",
        bio="",
    )
    with patch("src.services.users.emails.send_email", return_value=True) as sender:
        send_account_creation_email(user, "martin@example.com")
    body = sender.call_args.kwargs["body"]
    assert EMAIL_LOGO_HTML in body and EMAIL_HELP_URL in body
