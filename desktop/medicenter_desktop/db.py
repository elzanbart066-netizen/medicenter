"""SQLite дерекқоры: пайдаланушылар, дәрігерлер, жазылулар және демо деректер."""
import datetime as dt
import hashlib
import os
import random
import sqlite3

DB_PATH = os.environ.get("MEDICENTER_DB", os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "medicenter.db"))

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    login TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('Тіркеуші', 'Дәрігер', 'Әкімші')),
    doctor_id INTEGER REFERENCES doctors(id)
);
CREATE TABLE IF NOT EXISTS doctors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    specialty TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient TEXT NOT NULL,
    iin TEXT NOT NULL,
    phone TEXT NOT NULL,
    doctor_id INTEGER NOT NULL REFERENCES doctors(id),
    date TEXT NOT NULL,            -- YYYY-MM-DD
    time TEXT NOT NULL,            -- HH:MM
    complaint TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Күтуде' CHECK (status IN ('Күтуде', 'Келді', 'Бас тартты', 'Жаңа')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (doctor_id, date, time)  -- бір уақытқа бір дәрігерге бір пациент
);
"""

DOCTORS = [
    ("Нұрлан Ахметов", "Терапевт"), ("Әсел Жұмабаева", "Кардиолог"), ("Ерлан Беков", "Педиатр"),
    ("Гүлнар Исаева", "Невролог"), ("Самат Оспанов", "Офтальмолог"), ("Айнұр Бекболат", "Дерматолог"),
]
SLOTS = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
         "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"]

# Figma макетіндегі 10 жазба: (пациент, ЖСН, телефон, дәрігер №, күн ығысуы, уақыт, шағым, статус)
SEED = [
    ("Айгерім Сәрсенова", "990314450789", "+7 701 112 2233", 1, 1, "09:00", "Жалпы тексеру", "Келді"),
    ("Дәурен Қасымов", "870605300112", "+7 702 334 4556", 2, 1, "09:30", "Жүрек қағысы", "Күтуде"),
    ("Мадина Төлеген", "150921600234", "+7 705 778 1122", 3, 1, "10:00", "Жөтел, қызу", "Күтуде"),
    ("Арман Ержанов", "910112300456", "+7 707 990 3344", 1, 1, "10:30", "Бас айналу", "Бас тартты"),
    ("Жансая Мұратқызы", "000817650567", "+7 708 221 5566", 4, 1, "11:00", "Бас ауруы", "Күтуде"),
    ("Ерасыл Нұрланұлы", "850403300678", "+7 747 445 6677", 2, 2, "09:00", "Қан қысымы", "Күтуде"),
    ("Аружан Бақыт", "180210600789", "+7 771 667 8899", 3, 2, "09:30", "Егу", "Күтуде"),
    ("Санжар Әлиев", "930725300890", "+7 775 889 0011", 5, 2, "10:00", "Көру нашарлады", "Күтуде"),
    ("Томирис Қайратқызы", "040512650123", "+7 776 101 2233", 4, 2, "11:30", "Ұйқысыздық", "Жаңа"),
    ("Бекзат Сейітов", "880930300234", "+7 778 323 4455", 5, 3, "14:00", "Көзілдірік таңдау", "Күтуде"),
]

FIRST = ["Әлия", "Нұрай", "Олжас", "Дана", "Ринат", "Мөлдір", "Қанат", "Ләззат", "Мейір", "Ғалым", "Сәуле", "Заңғар",
         "Арайлым", "Ерболат", "Камила", "Темірлан", "Інжу", "Рустем", "Гаухар", "Ақжол"]
LAST = ["Жақсылық", "Сатыбалды", "Төлеу", "Ермек", "Әбіл", "Асқар", "Мұса", "Ибраева", "Құрманғали", "Серік",
        "Әміре", "Әлі", "Нұрғали", "Омаров", "Кенжебек", "Жұмаш", "Байжан", "Тоқтар"]


def hash_password(password: str) -> str:
    return hashlib.sha256(("medicenter:" + password).encode("utf-8")).hexdigest()


def connect(path: str = None) -> sqlite3.Connection:
    con = sqlite3.connect(path or DB_PATH)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA foreign_keys = ON")
    return con


class Database:
    """Барлық SQL сұраулары осында: UI тек осы әдістерді шақырады."""

    def __init__(self, path: str = None):
        self.con = connect(path)
        self.con.executescript(SCHEMA)
        if self.con.execute("SELECT COUNT(*) FROM users").fetchone()[0] == 0:
            self._seed()

    # ---------- демо деректер ----------
    def _seed(self, today: dt.date = None):
        today = today or dt.date.today()
        cur = self.con.cursor()
        cur.executemany("INSERT INTO doctors(name, specialty) VALUES (?, ?)", DOCTORS)
        cur.executemany(
            "INSERT INTO users(login, password_hash, full_name, role, doctor_id) VALUES (?, ?, ?, ?, ?)",
            [("d.omarova", hash_password("12345"), "Динара Омарова", "Тіркеуші", None),
             ("admin", hash_password("admin123"), "Бас әкімші", "Әкімші", None),
             ("n.akhmetov", hash_password("12345"), "Нұрлан Ахметов", "Дәрігер", 1)])
        # Figma-дағы 10 жазба: бүгін, ертең, арғы күн
        start = today - dt.timedelta(days=1)
        for p, iin, ph, doc, off, tm, comp, st in SEED:
            cur.execute("INSERT INTO appointments(patient, iin, phone, doctor_id, date, time, complaint, status) VALUES (?,?,?,?,?,?,?,?)",
                        (p, iin, ph, doc, (start + dt.timedelta(days=off)).isoformat(), tm, comp, st))
        # Статистика үшін өткен айлардың тарихы (детерминирленген)
        rnd = random.Random(7)
        jan1 = dt.date(today.year, 1, 1)
        day = jan1
        while day < today:
            if day.weekday() < 5:
                for _ in range(rnd.randint(9, 16)):
                    doc = rnd.choices(range(1, 7), weights=[30, 24, 22, 20, 14, 10])[0]
                    tm = rnd.choice(SLOTS)
                    st = rnd.choices(["Келді", "Бас тартты"], weights=[91, 9])[0]
                    name = f"{rnd.choice(FIRST)} {rnd.choice(LAST)}"
                    cur.execute("INSERT OR IGNORE INTO appointments(patient, iin, phone, doctor_id, date, time, complaint, status) VALUES (?,?,?,?,?,?,?,?)",
                                (name, f"{rnd.randint(10**11, 10**12 - 1)}", f"+7 7{rnd.randint(0, 79):02d} {rnd.randint(100, 999)} {rnd.randint(1000, 9999)}",
                                 doc, day.isoformat(), tm, "", st))
            day += dt.timedelta(days=1)
        # Алдағы күндерге бірнеше жазылу (дәрігер кестесі бос болмауы үшін)
        for off in range(1, 12):
            day = today + dt.timedelta(days=off)
            if day.weekday() >= 5:
                continue
            for _ in range(rnd.randint(5, 9)):
                cur.execute("INSERT OR IGNORE INTO appointments(patient, iin, phone, doctor_id, date, time, complaint, status) VALUES (?,?,?,?,?,?,?,?)",
                            (f"{rnd.choice(FIRST)} {rnd.choice(LAST)}", f"{rnd.randint(10**11, 10**12 - 1)}",
                             f"+7 7{rnd.randint(0, 79):02d} {rnd.randint(100, 999)} {rnd.randint(1000, 9999)}",
                             rnd.randint(1, 6), day.isoformat(), rnd.choice(SLOTS), "", "Күтуде"))
        self.con.commit()

    # ---------- пайдаланушылар ----------
    def check_user(self, login: str, password: str, role: str):
        row = self.con.execute("SELECT * FROM users WHERE login = ? AND password_hash = ?",
                               (login.strip(), hash_password(password))).fetchone()
        if row is None:
            return None, "Логин немесе құпиясөз қате"
        if row["role"] != role:
            return None, f"Бұл аккаунттың рөлі: {row['role']}"
        return dict(row), None

    # ---------- дәрігерлер ----------
    def doctors(self):
        return [dict(r) for r in self.con.execute("SELECT * FROM doctors ORDER BY id")]

    # ---------- жазылулар ----------
    def appointments(self, date_from: str = None, date_to: str = None, doctor_id: int = None):
        sql = ("SELECT a.*, d.name AS doctor, d.specialty FROM appointments a JOIN doctors d ON d.id = a.doctor_id WHERE 1=1")
        args = []
        if date_from:
            sql += " AND a.date >= ?"; args.append(date_from)
        if date_to:
            sql += " AND a.date <= ?"; args.append(date_to)
        if doctor_id:
            sql += " AND a.doctor_id = ?"; args.append(doctor_id)
        sql += " ORDER BY a.date, a.time"
        return [dict(r) for r in self.con.execute(sql, args)]

    def get_appointment(self, aid: int):
        r = self.con.execute("SELECT a.*, d.name AS doctor, d.specialty FROM appointments a JOIN doctors d ON d.id = a.doctor_id WHERE a.id = ?", (aid,)).fetchone()
        return dict(r) if r else None

    def busy_slots(self, doctor_id: int, date: str, exclude_id: int = None):
        rows = self.con.execute("SELECT time FROM appointments WHERE doctor_id = ? AND date = ? AND status != 'Бас тартты' AND id != ?",
                                (doctor_id, date, exclude_id or -1))
        return {r["time"] for r in rows}

    def add_appointment(self, data: dict) -> int:
        cur = self.con.execute(
            "INSERT INTO appointments(patient, iin, phone, doctor_id, date, time, complaint, status) VALUES (?,?,?,?,?,?,?,?)",
            (data["patient"], data["iin"], data["phone"], data["doctor_id"], data["date"], data["time"], data.get("complaint", ""), data.get("status", "Күтуде")))
        self.con.commit()
        return cur.lastrowid

    def update_appointment(self, aid: int, data: dict):
        self.con.execute(
            "UPDATE appointments SET patient=?, iin=?, phone=?, doctor_id=?, date=?, time=?, complaint=?, status=? WHERE id=?",
            (data["patient"], data["iin"], data["phone"], data["doctor_id"], data["date"], data["time"], data.get("complaint", ""), data["status"], aid))
        self.con.commit()

    def set_status(self, aid: int, status: str):
        self.con.execute("UPDATE appointments SET status = ? WHERE id = ?", (status, aid))
        self.con.commit()

    def delete_appointment(self, aid: int):
        self.con.execute("DELETE FROM appointments WHERE id = ?", (aid,))
        self.con.commit()

    # ---------- статистика ----------
    def status_counts(self, date_from: str, date_to: str):
        rows = self.con.execute("SELECT status, COUNT(*) n FROM appointments WHERE date BETWEEN ? AND ? GROUP BY status", (date_from, date_to))
        return {r["status"]: r["n"] for r in rows}

    def monthly_counts(self, year: int):
        rows = self.con.execute("SELECT CAST(strftime('%m', date) AS INTEGER) m, COUNT(*) n FROM appointments WHERE strftime('%Y', date) = ? GROUP BY m", (str(year),))
        out = [0] * 12
        for r in rows:
            out[r["m"] - 1] = r["n"]
        return out

    def top_doctors(self, date_from: str, date_to: str, limit: int = 4):
        rows = self.con.execute(
            "SELECT d.name, d.specialty, COUNT(a.id) n FROM doctors d JOIN appointments a ON a.doctor_id = d.id "
            "WHERE a.date BETWEEN ? AND ? GROUP BY d.id ORDER BY n DESC LIMIT ?", (date_from, date_to, limit))
        return [dict(r) for r in rows]

    def new_patients(self, date_from: str, date_to: str) -> int:
        return self.con.execute(
            "SELECT COUNT(*) FROM (SELECT iin FROM appointments GROUP BY iin HAVING MIN(date) BETWEEN ? AND ?)", (date_from, date_to)).fetchone()[0]
