"""Дерекқор логикасының тесттері:  python -m unittest discover -s tests"""
import os
import sqlite3
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from medicenter_desktop.db import Database  # noqa: E402


class DatabaseTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
        self.tmp.close()
        os.remove(self.tmp.name)
        self.db = Database(self.tmp.name)

    def tearDown(self):
        self.db.con.close()
        os.remove(self.tmp.name)

    def test_login_checks_password_and_role(self):
        user, err = self.db.check_user("d.omarova", "12345", "Тіркеуші")
        self.assertIsNotNone(user, err)
        self.assertIsNone(self.db.check_user("d.omarova", "wrong", "Тіркеуші")[0])
        self.assertIn("рөлі", self.db.check_user("d.omarova", "12345", "Әкімші")[1])

    def test_seed_has_figma_records(self):
        names = {r["patient"] for r in self.db.appointments()}
        self.assertIn("Айгерім Сәрсенова", names)
        self.assertIn("Томирис Қайратқызы", names)
        self.assertEqual(len(self.db.doctors()), 6)

    def test_crud_and_slot_uniqueness(self):
        data = {"patient": "Тест Пациент", "iin": "040512650999", "phone": "+7 700 000 0000",
                "doctor_id": 6, "date": "2030-01-07", "time": "09:00", "complaint": "", "status": "Күтуде"}
        aid = self.db.add_appointment(data)
        self.assertIn("09:00", self.db.busy_slots(6, "2030-01-07"))
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.add_appointment(dict(data, patient="Басқа адам"))
        self.db.update_appointment(aid, dict(data, time="10:00", status="Келді"))
        self.assertEqual(self.db.get_appointment(aid)["time"], "10:00")
        self.db.delete_appointment(aid)
        self.assertIsNone(self.db.get_appointment(aid))

    def test_statistics(self):
        self.assertEqual(len(self.db.monthly_counts(2026)), 12)
        self.assertTrue(self.db.top_doctors("2000-01-01", "2100-01-01"))


if __name__ == "__main__":
    unittest.main()
