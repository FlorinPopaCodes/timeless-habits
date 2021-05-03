import pytest

from main import check_task
from main import update_title
from datetime import datetime


def test_that_we_only_care_for_tasks_that_have_the_safety_pin_in_their_content():
    assert check_task("🧷 We need to keep this tasked pinned")


def test_that_we_ignore_other_emojis():
    assert False == check_task("🔧🦾🔩 Build factory of the future")


def test_everything_works_end_to_end():
    pass


def test_that_we_add_the_last_completion_date():
    assert datetime.now().strftime("%Y-%m-%d") in update_title("🧷 We need to keep this tasked pinned [2021-04-19]")


def test_that_we_increment_a_simple_counter():
    assert '544' in update_title("🧷 We need to keep this tasked pinned [543]")


def test_that_we_increment_a_bound_counter():
    assert '123/222' in update_title("🧷 We need to keep this tasked pinned [122/222]")
