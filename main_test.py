import pytest

from main import task_counter


def test_task_counter_does_nothing_most_of_the_time():
    assert 'Implement tower of Babel' == task_counter('Implement tower of Babel')


def test_task_counter_does_not_increment_random_numbers():
    assert 'Phone 555-555-555' == \
           task_counter('Phone 555-555-555')


def test_task_counter_increments_numbers_between_brakets():
    assert 'Solve https://exercism.io/my/tracks/ruby challenge [32]' == \
           task_counter('Solve https://exercism.io/my/tracks/ruby challenge [31]')


# @pytest.mark.xfail
def test_task_counter_increments_the_first_number_between_brakets():
    assert 'Solve https://exercism.io/my/tracks/ruby challenge [32/79]' == \
           task_counter('Solve https://exercism.io/my/tracks/ruby challenge [31/79]')
