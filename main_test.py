import pytest

from main import check_task


def test_that_we_only_care_for_tasks_that_have_the_safety_pin_in_their_content():
    assert check_task("🧷 We need to keep this tasked pinned")


def test_that_we_ignore_other_emojis():
    assert False == check_task("🔧🦾🔩 Build factory of the future")


def test_everything_works_end_to_end():
    pass
