"""Figma 01 Кіру терезесі, 02 негізгі терезе (QMainWindow) және қосымшаны іске қосу."""
import sys

from PySide6.QtCore import QSettings, Qt
from PySide6.QtGui import QFont
from PySide6.QtWidgets import (QApplication, QCheckBox, QFrame, QHBoxLayout, QLabel, QLineEdit, QMainWindow,
                               QStackedWidget, QVBoxLayout, QWidget)

from . import __version__
from .db import Database
from .dialogs import AppointmentDialog, confirm_delete
from .pages import AppointmentsPage, DashboardPage, DoctorsPage, StatsPage
from .theme import Theme, stylesheet
from .widgets import EcgLine, LoginBrandPanel, LogoMark, Segmented, Sidebar, Toast, button, icon, icon_pixmap, label

SETTINGS = QSettings("MediCenter", "Desktop")


class LoginWindow(QWidget):
    """Figma 01: Кіру. on_login() -> db.check_user() -> MainWindow(user).show()"""

    def __init__(self, db):
        super().__init__()
        self.db = db
        self.setWindowTitle("MediCenter Desktop — Жүйеге кіру")
        self.resize(1280, 800)
        root = QHBoxLayout(self)
        root.setContentsMargins(0, 0, 0, 0)
        root.setSpacing(0)

        left = LoginBrandPanel()
        left.setFixedWidth(560)
        ll = QVBoxLayout(left)
        ll.setContentsMargins(56, 56, 56, 48)
        brand = QHBoxLayout()
        brand.setSpacing(12)
        brand.addWidget(LogoMark(44))
        bc = QVBoxLayout()
        bc.setSpacing(0)
        for text, css in [("MediCenter", "color:white; font-size:24px; font-weight:800;"),
                          ("DESKTOP", "color:#7EE7DB; font-size:11px; font-weight:700; letter-spacing:3px;")]:
            lb = QLabel(text)
            lb.setStyleSheet(css + "background:transparent;")
            bc.addWidget(lb)
        brand.addLayout(bc)
        brand.addStretch()
        ll.addLayout(brand)
        ll.addStretch()
        h = QLabel("Клиниканың жүрегі —\nбір терезеде")
        h.setStyleSheet("color:white; font-size:40px; font-weight:800; background:transparent;")
        ll.addWidget(h)
        sub = QLabel("Пациенттер, дәрігерлер және қабылдау кестесі. Тіркеу бөлімінің барлық жұмысы бір қосымшада.")
        sub.setWordWrap(True)
        sub.setStyleSheet("color:#B9D3EE; font-size:15px; background:transparent;")
        ll.addSpacing(12)
        ll.addWidget(sub)
        ll.addSpacing(28)
        ll.addWidget(EcgLine(width=448, height=70, stroke=3, color="#7EE7DB"))
        ll.addSpacing(28)
        chips = QHBoxLayout()
        chips.setSpacing(10)
        for ic, n, t in [("heart", "10 000+", "пациент"), ("users", "48", "дәрігер"), ("calendar", "5", "филиал")]:
            f = QFrame()
            f.setStyleSheet("QFrame { background: rgba(255,255,255,0.12); border-radius: 12px; } QLabel { background: transparent; }")
            fl = QHBoxLayout(f)
            fl.setContentsMargins(14, 10, 14, 10)
            i = QLabel()
            i.setPixmap(icon_pixmap(ic, "#7EE7DB", 18))
            fl.addWidget(i)
            col = QVBoxLayout()
            col.setSpacing(0)
            a, b = QLabel(n), QLabel(t)
            a.setStyleSheet("color:white; font-weight:700; font-size:16px;")
            b.setStyleSheet("color:#B9D3EE; font-size:11px;")
            col.addWidget(a)
            col.addWidget(b)
            fl.addLayout(col)
            chips.addWidget(f)
        chips.addStretch()
        ll.addLayout(chips)
        root.addWidget(left)

        right = QWidget()
        right.setObjectName("LoginRight")
        rl = QVBoxLayout(right)
        rl.setAlignment(Qt.AlignCenter)
        form = QWidget()
        form.setFixedWidth(380)
        fl = QVBoxLayout(form)
        fl.setSpacing(16)
        fl.setContentsMargins(0, 0, 0, 0)
        t = label("Жүйеге кіру", "H1")
        t.setStyleSheet("font-size:28px;")
        fl.addWidget(t)
        fl.addWidget(label("Тіркеу бөлімінің жұмыс аккаунтымен кіріңіз", "Muted"))
        fl.addSpacing(4)
        fl.addWidget(label("Рөл", "FieldLabel"))
        self.role = Segmented(["Тіркеуші", "Дәрігер", "Әкімші"])
        fl.addWidget(self.role)
        fl.addWidget(label("Логин", "FieldLabel"))
        self.login = QLineEdit(SETTINGS.value("last_login", "d.omarova"))
        self.login.addAction(icon("user", "#64748B", 16), QLineEdit.LeadingPosition)
        fl.addWidget(self.login)
        fl.addWidget(label("Құпиясөз", "FieldLabel"))
        self.password = QLineEdit(echoMode=QLineEdit.Password, placeholderText="••••••••")
        self.password.addAction(icon("lock", "#64748B", 16), QLineEdit.LeadingPosition)
        self.password.returnPressed.connect(self.on_login)
        fl.addWidget(self.password)
        rem = QHBoxLayout()
        self.remember = QCheckBox("Есте сақтау")
        self.remember.setChecked(True)
        rem.addWidget(self.remember)
        rem.addStretch()
        hint = label("Демо: d.omarova / 12345", "Small")
        rem.addWidget(hint)
        fl.addLayout(rem)
        self.error = label("", "ErrorText")
        self.error.hide()
        fl.addWidget(self.error)
        self.btn_login = button("Кіру", "primary", name="btn_login")
        self.btn_login.setMinimumHeight(46)
        self.btn_login.clicked.connect(self.on_login)
        fl.addWidget(self.btn_login)
        fl.addSpacing(8)
        v = label(f"v{__version__} · Python {sys.version_info.major}.{sys.version_info.minor} · PySide6 · SQLite", "Small")
        v.setAlignment(Qt.AlignCenter)
        fl.addWidget(v)
        rl.addWidget(form)
        root.addWidget(right, 1)
        self.password.setFocus()

    def on_login(self):
        user, err = self.db.check_user(self.login.text(), self.password.text(), self.role.value())
        if not user:
            self.error.setText(err)
            self.error.show()
            self.password.setProperty("error", True)
            self.password.style().polish(self.password)
            return
        if self.remember.isChecked():
            SETTINGS.setValue("last_login", self.login.text().strip())
        self.main = MainWindow(self.db, user)
        self.main.show()
        self.close()


class MainWindow(QMainWindow):
    """Figma 02: QMainWindow = Sidebar + QStackedWidget (Басты бет, Жазылулар, Дәрігерлер, Статистика)."""
    TITLES = ["Басты бет", "Жазылулар", "Дәрігер кестесі", "Статистика"]

    def __init__(self, db, user):
        super().__init__()
        self.db, self.user = db, user
        self.resize(1280, 800)
        self.setMinimumSize(1100, 700)
        central = QWidget()
        lay = QHBoxLayout(central)
        lay.setContentsMargins(0, 0, 0, 0)
        lay.setSpacing(0)
        self.sidebar = Sidebar(user, Theme.dark)
        self.sidebar.navigate.connect(self.go)
        self.sidebar.theme_toggled.connect(self.apply_theme)
        self.sidebar.logout.connect(self.logout)
        lay.addWidget(self.sidebar)
        self.stack = QStackedWidget()
        lay.addWidget(self.stack, 1)
        self.setCentralWidget(central)
        self.toast = Toast(self)
        self.build_pages()
        self.go(0)

    def build_pages(self, index=0):
        while self.stack.count():
            w = self.stack.widget(0)
            self.stack.removeWidget(w)
            w.deleteLater()
        self.dashboard = DashboardPage(self.db, self.user)
        self.appointments = AppointmentsPage(self.db, self.user)
        self.doctors = DoctorsPage(self.db, self.user)
        self.stats = StatsPage(self.db, self.user)
        self.pages = [self.dashboard, self.appointments, self.doctors, self.stats]
        for p in self.pages:
            p.request_new.connect(self.open_add_dialog)
            p.request_edit.connect(self.open_edit_dialog)
            p.request_delete.connect(self.delete_appointment)
            self.stack.addWidget(p)
        self.dashboard.btn_all.clicked.connect(lambda: self.go(1))
        self.dashboard.search_submitted.connect(self.search_from_dashboard)
        self.appointments.toast.connect(lambda t, m: self.toast.show_message(t, m))
        self.stack.setCurrentIndex(index)

    def go(self, i):
        self.sidebar.set_current(i)
        self.stack.setCurrentIndex(i)
        self.pages[i].refresh()
        self.setWindowTitle(f"MediCenter Desktop — {self.TITLES[i]}")

    def refresh_all(self):
        self.pages[self.stack.currentIndex()].refresh()

    def search_from_dashboard(self, text):
        self.go(1)
        self.appointments.period.setCurrentIndex(4)  # соңғы 90 күн
        self.appointments.search.setText(text)

    # ---------- CRUD ----------
    def open_add_dialog(self, preset: dict):
        dlg = AppointmentDialog(self.db, self, doctor_id=preset.get("doctor_id"), date=preset.get("date"), time=preset.get("time"))
        if dlg.exec():
            d = dlg.data()
            self.toast.show_message("Сәтті қосылды", f"{d['patient']} · {d['date'][8:]}.{d['date'][5:7]}, {d['time']}")
            self.refresh_all()

    def open_edit_dialog(self, aid: int):
        rec = self.db.get_appointment(aid)
        if not rec:
            return
        dlg = AppointmentDialog(self.db, self, record=rec)
        if dlg.exec():
            if dlg.deleted:
                self.toast.show_message("Жазба жойылды", rec["patient"], "danger")
            else:
                self.toast.show_message("Сәтті сақталды", f"{rec['patient']} · өзгерістер сақталды")
            self.refresh_all()

    def delete_appointment(self, aid: int):
        rec = self.db.get_appointment(aid)
        if rec and confirm_delete(self, rec):
            self.db.delete_appointment(aid)
            self.toast.show_message("Жазба жойылды", rec["patient"], "danger")
            self.refresh_all()

    # ---------- тема ----------
    def apply_theme(self, dark: bool):
        Theme.set_dark(dark)
        SETTINGS.setValue("dark", dark)
        QApplication.instance().setStyleSheet(stylesheet())
        self.build_pages(self.stack.currentIndex())  # иконкалар мен чиптерді жаңа түспен қайта салу
        self.pages[self.stack.currentIndex()].refresh()

    def logout(self):
        self.login = LoginWindow(self.db)
        self.login.show()
        self.close()


def run():
    app = QApplication(sys.argv)
    app.setApplicationName("MediCenter Desktop")
    app.setFont(QFont("Inter", 10))
    Theme.set_dark(str(SETTINGS.value("dark", "false")).lower() == "true")
    app.setStyleSheet(stylesheet())
    db = Database()
    win = LoginWindow(db)
    win.show()
    return app.exec()
