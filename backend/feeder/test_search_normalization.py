from django.test import TestCase

from feeder.search_normalization import normalize_search_text


class NormalizeSearchTextTests(TestCase):
    def test_cyrillic_casefold(self):
        self.assertEqual(normalize_search_text('Ло'), normalize_search_text('ло'))

    def test_yo_normalization(self):
        self.assertEqual(normalize_search_text('ёлка'), normalize_search_text('елка'))
