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

def chance(thresh:int=50):
    r = random.randint(1,100)
    time.sleep(.1)
    return (r > 100-thresh)

def test_high_chance():
    assert (chance(90) and chance(90))

def test_mid_chance():
    assert (chance(70) and chance(70))

# def test_low_chance():
#     assert (chance(60) and chance(50))

