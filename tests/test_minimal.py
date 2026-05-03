import os
import random
import time

from check_internet import check_internet

def test_always_passes():
    assert True

def test_internet():
    assert check_internet()

def no_test_chrome_available():
    assert 0==os.system("type chrome")

def chance(thresh: int = 50, randint=random.randint, delay=time.sleep):
    r = randint(1, 100)
    delay(.1)
    return r > 100 - thresh

def test_high_chance():
    assert chance(90, randint=lambda *_: 95, delay=lambda _: None)

def test_mid_chance():
    assert chance(70, randint=lambda *_: 31, delay=lambda _: None)

# def test_low_chance():
#     assert (chance(60) and chance(50))

