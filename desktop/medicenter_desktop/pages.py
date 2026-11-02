"""Figma 02 / 04 / 06 / 07: Басты бет, Жазылулар, Дәрігер кестесі, Статистика беттері."""
import csv
import datetime as dt

from PySide6.QtCore import QDate, QSize, Qt, Signal
from PySide6.QtWidgets import (QAbstractItemView, QComboBox, QFileDialog, QFrame, QGridLayout, QHBoxLayout, QHeaderView,
                               QLabel, QLineEdit, QListWidget, QListWidgetItem, QPushButton, QSizePolicy, QTableWidget,
                               QTableWidgetItem, QVBoxLayout, QWidget)

from .db import SLOTS
from .theme import STATUSES, c
from .widgets import (Avatar, BarChart, Card, Donut, QueueBar, Segmented, StatCard, StatusChip, button, icon,
                      icon_button, icon_pixmap, label)

MONTHS = ["қаңтар", "ақпан", "наурыз", "сәуір", "мамыр", "маусым", "шілде", "тамыз", "қыркүйек", "қазан", "қараша", "желтоқсан"]
MONTHS_SHORT = ["Қаң", "Ақп", "Нау", "Сәу", "Мам", "Мау", "Шіл", "Там", "Қыр", "Қаз", "Қар", "Жел"]
WEEKDAYS = ["Дүйсенбі", "Сейсенбі", "Сәрсенбі", "Бейсенбі", "Жұма", "Сенбі", "Жексенбі"]
WD_SHORT = ["Дс", "Сс", "Ср", "Бс", "Жм"]


def today():
    return dt.date.today()


def kz_date(d: dt.date) -> str:
    return f"{WEEKDAYS[d.weekday()]}, {d.day} {MONTHS[d.month - 1]} {d.year}"


def dmy(iso: str) -> str:
    y, m, d = iso.split("-")
    return f"{d}.{m}.{y}"


class Page(QWidget):
    """Барлық беттің ортақ қаңқасы: тақырып жолы + мазмұн."""
    request_new = Signal(dict)       # жаңа жазылу диалогын ашу (алдын ала толтырылған мәндер)
    request_edit = Signal(int)       # жазбаны өңдеу
    request_delete = Signal(int)

    def __init__(self, db, user, parent=None):
        super().__init__(parent)
        self.setObjectName("Page")
        self.db, self.user = db, user
        self.root = QVBoxLayout(self)
        self.root.setContentsMargins(28, 24, 28, 24)
        self.root.setSpacing(16)

    def doctor_filter(self):
        """Дәрігер рөлі тек өз жазылуларын көреді."""
        return self.user.get("doctor_id") if self.user["role"] == "Дәрігер" else None

    def header(self, title, subtitle, *right):
        row = QHBoxLayout()
        col = QVBoxLayout()
        col.setSpacing(4)
        col.addWidget(label(title, "H1"))
        self.subtitle = label(subtitle, "Muted")
        col.addWidget(self.subtitle)
        row.addLayout(col)
        row.addStretch()
        for w in right:
            row.addWidget(w)
        self.root.addLayout(row)

    def refresh(self):
        pass


def make_table(headers, widths, stretch_col):
    t = QTableWidget(0, len(headers))
    t.setHorizontalHeaderLabels([h.upper() for h in headers])
    t.verticalHeader().hide()
    t.setShowGrid(False)
    t.setSelectionBehavior(QAbstractItemView.SelectRows)
    t.setSelectionMode(QAbstractItemView.SingleSelection)
    t.setEditTriggers(QAbstractItemView.NoEditTriggers)
    t.setFocusPolicy(Qt.NoFocus)
    hh = t.horizontalHeader()
    hh.setDefaultAlignment(Qt.AlignLeft | Qt.AlignVCenter)
    hh.setHighlightSections(False)
    for i, w in enumerate(widths):
        if i == stretch_col:
            hh.setSectionResizeMode(i, QHeaderView.Stretch)
        else:
            hh.setSectionResizeMode(i, QHeaderView.Fixed)
            t.setColumnWidth(i, w)
    return t


def two_line(top, bottom, avatar=None, mono=False):
    w = QWidget()
    lay = QHBoxLayout(w)
    lay.setContentsMargins(8, 0, 4, 0)
    lay.setSpacing(10)
    if avatar:
        lay.addWidget(Avatar(avatar, 30))
    col = QVBoxLayout()
    col.setSpacing(1)
    a = label(top)
    a.setStyleSheet("font-weight:600; font-size:13px; background:transparent;" + (" font-family:'JetBrains Mono','Consolas';" if mono else ""))
    b = label(bottom, "Small")
    col.addStretch()
    col.addWidget(a)
    col.addWidget(b)
    col.addStretch()
    lay.addLayout(col, 1)
    return w


def chip_cell(status):
    w = QWidget()
    lay = QHBoxLayout(w)
    lay.setContentsMargins(8, 0, 0, 0)
    lay.addWidget(StatusChip(status))
    lay.addStretch()
    return w


# =====================================================================
class DashboardPage(Page):
    """Figma 02: Басты терезе."""
    search_submitted = Signal(str)

    def __init__(self, db, user, parent=None):
        super().__init__(db, user, parent)
        self.search = QLineEdit(placeholderText="Аты, ЖСН немесе телефон")
        self.search.addAction(icon("search", c("text_secondary"), 16), QLineEdit.LeadingPosition)
        self.search.setFixedWidth(280)
        self.search.returnPressed.connect(lambda: self.search_submitted.emit(self.search.text()))
        self.btn_new = button("Жаңа жазылу", "primary", "plus", "btn_new_appointment")
        self.btn_new.clicked.connect(lambda: self.request_new.emit({}))
        self.header(self.greeting(), "", self.search, self.btn_new)

        stats = QHBoxLayout()
        stats.setSpacing(16)
        self.cards = {
            "all": StatCard("Бүгінгі жазылулар", "calendar", "primary", "soft"),
            "Келді": StatCard("Келді", "check", "success", "success_soft"),
            "Күтуде": StatCard("Күтуде", "clock", "warning", "warning_soft"),
            "Бас тартты": StatCard("Бас тартты", "x", "danger", "danger_soft"),
        }
        for cd in self.cards.values():
            stats.addWidget(cd)
        self.root.addLayout(stats)

        q = Card(padding=(18, 14, 18, 14))
        top = QHBoxLayout()
        top.addWidget(label("Бүгінгі кезек", "H2"))
        live = label("● ТІРІ")
        live.setStyleSheet(f"background:{c('danger_soft')}; color:{c('danger')}; border-radius:9px; padding:2px 8px; font-size:10px; font-weight:800;")
        top.addWidget(live)
        top.addStretch()
        self.legend = label("", "Small")
        top.addWidget(self.legend)
        q.lay.addLayout(top)
        self.queue = QueueBar()
        q.lay.addWidget(self.queue)
        self.root.addWidget(q)

        bottom = QHBoxLayout()
        bottom.setSpacing(16)
        tc = Card(padding=(0, 0, 0, 0), spacing=0)
        th = QHBoxLayout()
        th.setContentsMargins(18, 14, 18, 14)
        th.addWidget(label("Бүгінгі жазылулар", "H2"))
        th.addStretch()
        self.btn_all = QPushButton("Барлығын көру ›")
        self.btn_all.setObjectName("Link")
        self.btn_all.setCursor(Qt.PointingHandCursor)
        th.addWidget(self.btn_all)
        tc.lay.addLayout(th)
        self.table = make_table(["Уақыты", "Пациент", "Дәрігер", "Статус"], [80, 0, 190, 130], 1)
        self.table.verticalHeader().setDefaultSectionSize(54)
        self.table.cellDoubleClicked.connect(lambda r, _: self.request_edit.emit(self.table.item(r, 0).data(Qt.UserRole)))
        tc.lay.addWidget(self.table)
        bottom.addWidget(tc, 1)
        self.docs = Card(padding=(16, 14, 16, 14), spacing=6)
        self.docs.setFixedWidth(290)
        bottom.addWidget(self.docs)
        self.root.addLayout(bottom, 1)

    def greeting(self):
        h = dt.datetime.now().hour
        part = "Қайырлы таң" if h < 12 else "Қайырлы күн" if h < 18 else "Қайырлы кеш"
        return f"{part}, {self.user['full_name'].split()[0]}"

    def refresh(self):
        d = today().isoformat()
        rows = self.db.appointments(d, d, self.doctor_filter())
        counts = {s: sum(1 for r in rows if r["status"] == s) for s in STATUSES}
        n = len(rows)
        self.subtitle.setText(f"{kz_date(today())} · Бүгін {n} қабылдау жоспарланған")
        done_pct = round(counts["Келді"] / n * 100) if n else 0
        nxt = next((r["time"] for r in rows if r["status"] in ("Күтуде", "Жаңа") and r["time"] >= dt.datetime.now().strftime("%H:%M")), "—")
        self.cards["all"].set(n, f"{n} жазба · {len(set(r['doctor_id'] for r in rows))} дәрігер")
        self.cards["Келді"].set(counts["Келді"], f"{done_pct}% орындалды")
        self.cards["Күтуде"].set(counts["Күтуде"] + counts["Жаңа"], f"келесісі {nxt}")
        self.cards["Бас тартты"].set(counts["Бас тартты"], f"{round(counts['Бас тартты'] / n * 100) if n else 0}% бас тарту")
        waiting = counts["Күтуде"] + counts["Жаңа"]
        self.queue.set_parts([(counts["Келді"], "success"), (counts["Бас тартты"], "danger"), (waiting, "warning")])
        self.legend.setText(f"<span style='color:{c('success')}'>■</span> Келді {counts['Келді']} &nbsp;&nbsp; "
                            f"<span style='color:{c('warning')}'>■</span> Күтуде {waiting} &nbsp;&nbsp; "
                            f"<span style='color:{c('danger')}'>■</span> Бас тартты {counts['Бас тартты']}")
        self.table.setRowCount(0)
        for r in rows:
            i = self.table.rowCount()
            self.table.insertRow(i)
            it = QTableWidgetItem(r["time"])
            it.setData(Qt.UserRole, r["id"])
            it.setFont(self._mono())
            self.table.setItem(i, 0, it)
            self.table.setCellWidget(i, 1, two_line(r["patient"], r["phone"], r["patient"]))
            self.table.setCellWidget(i, 2, two_line(r["doctor"], r["specialty"]))
            self.table.setCellWidget(i, 3, chip_cell(r["status"]))
        # Кезекші дәрігерлер
        while self.docs.lay.count():
            item = self.docs.lay.takeAt(0)
            if item.widget():
                item.widget().deleteLater()
            elif item.layout():
                self._clear(item.layout())
        h = QHBoxLayout()
        h.addWidget(label("Кезекші дәрігерлер", "H2"))
        h.addStretch()
        self.docs.lay.addLayout(h)
        for d in self.db.doctors()[:5]:
            load = sum(1 for r in self.db.appointments(today().isoformat(), today().isoformat(), d["id"]) if r["status"] != "Бас тартты")
            row = QHBoxLayout()
            row.setSpacing(10)
            row.addWidget(Avatar(d["name"], 34))
            col = QVBoxLayout()
            col.setSpacing(3)
            t = QHBoxLayout()
            t.addWidget(label(d["name"]))
            t.addStretch()
            t.addWidget(label(f"{load}/8", "Small"))
            col.addLayout(t)
            col.addWidget(label(d["specialty"], "Small"))
            bar = QueueBar()
            bar.setFixedHeight(5)
            bar.set_parts([(min(load, 8), "warning" if load >= 7 else "primary"), (max(8 - load, 0), "bg_subtle")])
            col.addWidget(bar)
            row.addLayout(col, 1)
            self.docs.lay.addLayout(row)
        self.docs.lay.addStretch()

    @staticmethod
    def _mono():
        from PySide6.QtGui import QFont
        f = QFont("JetBrains Mono")
        f.setStyleHint(QFont.Monospace)
        f.setWeight(QFont.DemiBold)
        return f

    def _clear(self, layout):
        while layout.count():
            item = layout.takeAt(0)
            if item.widget():
                item.widget().deleteLater()
            elif item.layout():
                self._clear(item.layout())


# =====================================================================
class AppointmentsPage(Page):
    """Figma 04: Жазылулар — іздеу, сүзу, кесте, экспорт."""
    toast = Signal(str, str)

    def __init__(self, db, user, parent=None):
        super().__init__(db, user, parent)
        self.btn_export = button("CSV экспорт", "secondary", "download", "btn_export")
        self.btn_export.clicked.connect(self.export_csv)
        self.btn_new = button("Жаңа жазылу", "primary", "plus", "btn_new_appointment")
        self.btn_new.clicked.connect(lambda: self.request_new.emit({}))
        self.header("Жазылулар", "", self.btn_export, self.btn_new)

        f = QHBoxLayout()
        f.setSpacing(10)
        self.search = QLineEdit(placeholderText="Аты, ЖСН немесе телефон бойынша іздеу...")
        self.search.addAction(icon("search", c("text_secondary"), 16), QLineEdit.LeadingPosition)
        self.search.setClearButtonEnabled(True)
        self.search.textChanged.connect(self.apply_filters)
        f.addWidget(self.search, 1)
        self.doctor = QComboBox()
        self.doctor.addItem("Дәрігер: барлығы", None)
        for d in db.doctors():
            self.doctor.addItem(d["name"], d["id"])
        self.period = QComboBox()
        for text, key in [("Күні: алдағы", "future"), ("Бүгін", "today"), ("Осы апта", "week"), ("Соңғы 30 күн", "month"), ("Соңғы 90 күн", "quarter")]:
            self.period.addItem(text, key)
        self.period.currentIndexChanged.connect(self.refresh)
        self.status = QComboBox()
        self.status.addItem("Статус: барлығы", None)
        for s in STATUSES:
            self.status.addItem(s, s)
        for cb in (self.doctor, self.status):
            cb.currentIndexChanged.connect(self.apply_filters)
            f.addWidget(cb)
        f.insertWidget(2, self.period)
        clear = button("Тазалау", "ghost", "x")
        clear.clicked.connect(self.clear_filters)
        f.addWidget(clear)
        self.root.addLayout(f)

        card = Card(padding=(0, 0, 0, 0), spacing=0)
        self.table = make_table(["ID", "Пациент", "Телефон", "Дәрігер", "Күні / уақыты", "Статус", ""], [52, 0, 150, 200, 120, 130, 84], 1)
        self.table.verticalHeader().setDefaultSectionSize(48)
        self.table.cellDoubleClicked.connect(lambda r, _: self.request_edit.emit(self.row_id(r)))
        card.lay.addWidget(self.table, 1)
        foot = QHBoxLayout()
        foot.setContentsMargins(16, 10, 16, 10)
        self.count = label("", "Small")
        foot.addWidget(self.count)
        foot.addStretch()
        foot.addWidget(label("Жолды екі рет басыңыз — өңдеу", "Small"))
        card.lay.addLayout(foot)
        self.root.addWidget(card, 1)

    def row_id(self, r):
        return self.table.item(r, 0).data(Qt.UserRole)

    def period_range(self):
        """Күн сүзгісі SQL деңгейінде орындалады (тарих мыңдаған жазба болуы мүмкін)."""
        t = today()
        key = self.period.currentData()
        if key == "today":
            return t, t
        if key == "week":
            ws = t - dt.timedelta(days=t.weekday())
            return ws, ws + dt.timedelta(days=6)
        if key == "month":
            return t - dt.timedelta(days=30), t
        if key == "quarter":
            return t - dt.timedelta(days=90), t
        return t, None

    def refresh(self):
        a, b = self.period_range()
        self.rows = self.db.appointments(a.isoformat(), b.isoformat() if b else None, self.doctor_filter())
        self.table.setUpdatesEnabled(False)
        self.table.setRowCount(0)
        for r in self.rows:
            i = self.table.rowCount()
            self.table.insertRow(i)
            it = QTableWidgetItem(f"{r['id']:02d}")
            it.setData(Qt.UserRole, r["id"])
            it.setForeground(Qt.gray)
            self.table.setItem(i, 0, it)
            self.table.setCellWidget(i, 1, two_line(r["patient"], f"ЖСН {r['iin']}", r["patient"]))
            self.table.setItem(i, 2, QTableWidgetItem(r["phone"]))
            self.table.setCellWidget(i, 3, two_line(r["doctor"], r["specialty"]))
            self.table.setCellWidget(i, 4, two_line(dmy(r["date"]), r["time"], mono=True))
            self.table.setCellWidget(i, 5, chip_cell(r["status"]))
            act = QWidget()
            al = QHBoxLayout(act)
            al.setContentsMargins(4, 0, 4, 0)
            al.setSpacing(4)
            e = icon_button("edit", "primary", "Өңдеу")
            e.clicked.connect(lambda _=False, aid=r["id"]: self.request_edit.emit(aid))
            dl = icon_button("trash", "danger", "Жою")
            dl.clicked.connect(lambda _=False, aid=r["id"]: self.request_delete.emit(aid))
            al.addWidget(e)
            al.addWidget(dl)
            self.table.setCellWidget(i, 6, act)
        self.table.setUpdatesEnabled(True)
        self.apply_filters()

    def apply_filters(self):
        """Іздеу + дәрігер + күн + статус сүзгілері (жолдарды жасырады)."""
        q = self.search.text().strip().lower()
        doc, status = self.doctor.currentData(), self.status.currentData()
        shown = 0
        for i, r in enumerate(self.rows):
            ok = (not q or q in r["patient"].lower() or q in r["iin"] or q.replace(" ", "") in r["phone"].replace(" ", ""))
            ok = ok and (doc is None or r["doctor_id"] == doc) and (status is None or r["status"] == status)
            self.table.setRowHidden(i, not ok)
            shown += ok
        self.count.setText(f"{shown} / {len(self.rows)} жазба көрсетілді")
        self.subtitle.setText(f"{self.period.currentText().replace('Күні: ', '').capitalize()}: {len(self.rows)} жазба · сүзгіден кейін {shown}")

    def clear_filters(self):
        self.search.clear()
        self.doctor.setCurrentIndex(0)
        self.period.setCurrentIndex(0)
        self.status.setCurrentIndex(0)

    def export_csv(self):
        path, _ = QFileDialog.getSaveFileName(self, "CSV-ке экспорт", f"medicenter_{today().isoformat()}.csv", "CSV (*.csv)")
        if not path:
            return
        with open(path, "w", newline="", encoding="utf-8-sig") as fh:
            w = csv.writer(fh, delimiter=";")
            w.writerow(["ID", "Пациент", "ЖСН", "Телефон", "Дәрігер", "Мамандық", "Күні", "Уақыты", "Статус"])
            for i, r in enumerate(self.rows):
                if not self.table.isRowHidden(i):
                    w.writerow([r["id"], r["patient"], r["iin"], r["phone"], r["doctor"], r["specialty"], dmy(r["date"]), r["time"], r["status"]])
        self.toast.emit("Экспорт дайын", path)


# =====================================================================
class DoctorsPage(Page):
    """Figma 06: Дәрігер кестесі — апталық күнтізбе, бос слотты басу → жаңа жазылу."""
    HOURS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"]

    def __init__(self, db, user, parent=None):
        super().__init__(db, user, parent)
        self.week_start = today() - dt.timedelta(days=today().weekday())
        nav = QFrame()
        nav.setObjectName("Card")
        nl = QHBoxLayout(nav)
        nl.setContentsMargins(6, 4, 6, 4)
        prev, nxt = icon_button("chevronL", "text_primary", "Алдыңғы апта"), icon_button("chevronR", "text_primary", "Келесі апта")
        self.week_label = label("")
        self.week_label.setStyleSheet("font-weight:600; background:transparent;")
        prev.clicked.connect(lambda: self.shift(-7))
        nxt.clicked.connect(lambda: self.shift(7))
        nl.addWidget(prev)
        nl.addWidget(self.week_label)
        nl.addWidget(nxt)
        self.header("Дәрігер кестесі", "Бос слотты басыңыз — жазылу формасы дәрігер мен уақыт толтырылған күйде ашылады", nav)

        row = QHBoxLayout()
        row.setSpacing(16)
        lc = Card(padding=(14, 14, 14, 14), spacing=8)
        lc.setFixedWidth(260)
        lc.lay.addWidget(label("Дәрігерлер", "H2"))
        self.list = QListWidget()
        self.list.setSpacing(2)
        for d in db.doctors():
            it = QListWidgetItem(f"{d['name']}\n{d['specialty']}")
            it.setData(Qt.UserRole, d["id"])
            it.setSizeHint(QSize(200, 52))
            self.list.addItem(it)
        self.list.currentRowChanged.connect(lambda _: self.refresh())
        lc.lay.addWidget(self.list, 1)
        row.addWidget(lc)
        gc = Card(padding=(0, 0, 0, 0), spacing=0)
        self.grid = QTableWidget(len(self.HOURS), 5)
        self.grid.setVerticalHeaderLabels(self.HOURS)
        self.grid.setShowGrid(False)
        self.grid.setEditTriggers(QAbstractItemView.NoEditTriggers)
        self.grid.setSelectionMode(QAbstractItemView.NoSelection)
        self.grid.setFocusPolicy(Qt.NoFocus)
        self.grid.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        self.grid.verticalHeader().setSectionResizeMode(QHeaderView.Stretch)
        self.grid.verticalHeader().setFixedWidth(64)
        gc.lay.addWidget(self.grid, 1)
        leg = QHBoxLayout()
        leg.setContentsMargins(16, 10, 16, 10)
        leg.setSpacing(18)
        for text, key in [("■ Бос емес", "primary"), ("□ Бос (басыңыз)", "text_secondary"), ("■ Түскі үзіліс", "border_strong")]:
            lb = label(text, "Small")
            lb.setStyleSheet(f"color:{c(key)}; background:transparent;")
            leg.addWidget(lb)
        leg.addStretch()
        gc.lay.addLayout(leg)
        row.addWidget(gc, 1)
        self.root.addLayout(row, 1)
        if self.doctor_filter():
            self.list.setCurrentRow(self.doctor_filter() - 1)
            self.list.setEnabled(False)
        else:
            self.list.setCurrentRow(0)

    def shift(self, days):
        self.week_start += dt.timedelta(days=days)
        self.refresh()

    def refresh(self):
        it = self.list.currentItem()
        if not it:
            return
        self.doc_id = it.data(Qt.UserRole)
        ws, we = self.week_start, self.week_start + dt.timedelta(days=4)
        self.week_label.setText(f"{ws.day}–{we.day} {MONTHS[we.month - 1]} {we.year}")
        self.grid.setHorizontalHeaderLabels([f"{WD_SHORT[i]}  {(ws + dt.timedelta(days=i)).day}" for i in range(5)])
        appts = {(r["date"], r["time"]): r for r in self.db.appointments(ws.isoformat(), we.isoformat(), self.doc_id) if r["status"] != "Бас тартты"}
        for row, hour in enumerate(self.HOURS):
            for col in range(5):
                day = ws + dt.timedelta(days=col)
                holder = QWidget()
                hl = QVBoxLayout(holder)
                hl.setContentsMargins(4, 3, 4, 3)
                hl.setSpacing(3)
                if hour == "13:00":
                    w = label("Түскі үзіліс", "SlotLunch")
                    w.setAlignment(Qt.AlignCenter)
                    hl.addWidget(w)
                else:
                    for t in (hour, hour[:2] + ":30"):
                        r = appts.get((day.isoformat(), t))
                        if r:
                            first, *rest = r["patient"].split()
                            w = label(f"{first} {rest[0][0]}." if rest else first, "SlotBusy")
                            w.setToolTip(f"{t} · {r['patient']} · {r['phone']} · {r['status']}")
                        elif day < today():
                            w = label(t, "SlotPast")
                            w.setAlignment(Qt.AlignCenter)
                        else:
                            w = QPushButton(f"+ {t}")
                            w.setObjectName("SlotFree")
                            w.setCursor(Qt.PointingHandCursor)
                            w.setToolTip("Басыңыз: осы уақытқа жаңа жазылу")
                            w.clicked.connect(lambda _=False, d=day.isoformat(), tt=t: self.on_slot_clicked(d, tt))
                        w.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
                        hl.addWidget(w)
                self.grid.setCellWidget(row, col, holder)

    def on_slot_clicked(self, day, time):
        self.request_new.emit({"doctor_id": self.doc_id, "date": day, "time": time})


# =====================================================================
class StatsPage(Page):
    """Figma 07: Статистика — KPI, айлық график, статус диаграммасы, топ дәрігерлер."""

    def __init__(self, db, user, parent=None):
        super().__init__(db, user, parent)
        self.header("Статистика", "")
        kp = QHBoxLayout()
        kp.setSpacing(16)
        self.kpi = {
            "month": StatCard("30 күндегі жазылулар", "calendar", "primary", "soft"),
            "rate": StatCard("Келу деңгейі", "check", "success", "success_soft"),
            "perday": StatCard("Күніне орташа", "clock", "warning", "warning_soft"),
            "new": StatCard("Жаңа пациенттер", "heart", "navy", "soft"),
        }
        for k in self.kpi.values():
            k.ecg.hide()
            kp.addWidget(k)
        self.root.addLayout(kp)
        mid = QHBoxLayout()
        mid.setSpacing(16)
        bc = Card(padding=(18, 16, 18, 16))
        bh = QHBoxLayout()
        bh.addWidget(label("Айлық жазылулар", "H2"))
        bh.addStretch()
        self.trend = label("", "Small")
        bh.addWidget(self.trend)
        bc.lay.addLayout(bh)
        self.bars = BarChart()
        bc.lay.addWidget(self.bars, 1)
        mid.addWidget(bc, 1)
        dc = Card(padding=(18, 16, 18, 16))
        dc.setFixedWidth(300)
        dc.lay.addWidget(label("Статус бойынша", "H2"))
        self.donut = Donut()
        dc.lay.addWidget(self.donut, 0, Qt.AlignHCenter)
        self.legend = QVBoxLayout()
        dc.lay.addLayout(self.legend)
        dc.lay.addStretch()
        mid.addWidget(dc)
        self.root.addLayout(mid, 1)
        self.top = Card(padding=(18, 14, 18, 14))
        self.top.lay.addWidget(label("Топ дәрігерлер · соңғы 30 күн", "H2"))
        self.top_row = QHBoxLayout()
        self.top_row.setSpacing(24)
        self.top.lay.addLayout(self.top_row)
        self.root.addWidget(self.top)

    def refresh(self):
        t = today()
        m0, m1 = (t - dt.timedelta(days=29)).isoformat(), t.isoformat()           # соңғы 30 күн
        p0, p1 = (t - dt.timedelta(days=59)).isoformat(), (t - dt.timedelta(days=30)).isoformat()
        self.subtitle.setText(f"Соңғы 30 күн және {t.year} жылғы айлар · барлық дәрігерлер")
        cnt = self.db.status_counts(m0, m1)
        total = sum(cnt.values())
        prev_total = sum(self.db.status_counts(p0, p1).values())
        delta = (total - prev_total) / prev_total * 100 if prev_total else 0
        done, cancel = cnt.get("Келді", 0), cnt.get("Бас тартты", 0)
        rate = done / (done + cancel) * 100 if done + cancel else 0
        workdays = sum(1 for i in range(30) if (t - dt.timedelta(days=i)).weekday() < 5) or 1
        self.kpi["month"].set(total, f"{delta:+.1f}% алдыңғы 30 күнге қарағанда")
        self.kpi["rate"].set(f"{rate:.0f}%", "келгендер / келуі тиіс")
        self.kpi["perday"].set(f"{total / workdays:.1f}", "жұмыс күніне")
        self.kpi["new"].set(self.db.new_patients(m0, m1), "алғаш келгендер")
        monthly = self.db.monthly_counts(t.year)
        self.bars.set_data(monthly, MONTHS_SHORT, t.month - 1)
        first = next((v for v in monthly if v), 0)
        self.trend.setText(f"Жыл басынан: {sum(monthly)} жазылу · {MONTHS_SHORT[t.month - 1]} — ағымдағы ай")
        parts = [(done, "success"), (cnt.get("Күтуде", 0) + cnt.get("Жаңа", 0), "warning"), (cancel, "danger")]
        self.donut.set_data(parts, str(total))
        self._clear(self.legend)
        for (n, key), name in zip(parts, ["Келді", "Күтуде", "Бас тартты"]):
            r = QHBoxLayout()
            dot = label("■")
            dot.setStyleSheet(f"color:{c(key)}; background:transparent;")
            r.addWidget(dot)
            r.addWidget(label(name), 1)
            r.addWidget(label(str(n), "Small"))
            pct = label(f"{(n / total * 100 if total else 0):.0f}%")
            pct.setStyleSheet("font-weight:700; background:transparent;")
            pct.setFixedWidth(42)
            pct.setAlignment(Qt.AlignRight | Qt.AlignVCenter)
            r.addWidget(pct)
            self.legend.addLayout(r)
        self._clear(self.top_row)
        tops = self.db.top_doctors(m0, m1)
        mx = max((d["n"] for d in tops), default=1)
        for i, d in enumerate(tops):
            col = QVBoxLayout()
            col.setSpacing(4)
            h = QHBoxLayout()
            num = label(str(i + 1))
            num.setFixedSize(24, 24)
            num.setAlignment(Qt.AlignCenter)
            num.setStyleSheet(f"background:{c('primary') if i == 0 else c('bg_subtle')}; color:{'white' if i == 0 else c('text_secondary')}; border-radius:7px; font-weight:700;")
            h.addWidget(num)
            h.addWidget(label(d["name"]), 1)
            h.addWidget(label(str(d["n"])))
            col.addLayout(h)
            col.addWidget(label(d["specialty"], "Small"))
            bar = QueueBar()
            bar.setFixedHeight(6)
            bar.set_parts([(d["n"], "primary" if i == 0 else "mint"), (mx - d["n"], "bg_subtle")])
            col.addWidget(bar)
            self.top_row.addLayout(col, 1)

    def _clear(self, layout):
        while layout.count():
            item = layout.takeAt(0)
            if item.widget():
                item.widget().deleteLater()
            elif item.layout():
                self._clear(item.layout())
