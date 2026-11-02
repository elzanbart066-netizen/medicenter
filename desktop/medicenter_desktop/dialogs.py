"""Figma 03 / 05 / 05b: жаңа жазылу, өңдеу және жоюды растау диалогтары."""
import re

from PySide6.QtCore import QDate, Qt
from PySide6.QtGui import QKeySequence, QShortcut
from PySide6.QtWidgets import (QButtonGroup, QComboBox, QDateEdit, QDialog, QFrame, QGridLayout, QHBoxLayout, QLabel,
                               QLineEdit, QMessageBox, QPushButton, QTextEdit, QVBoxLayout, QWidget)

from .db import SLOTS
from .theme import c
from .widgets import Segmented, button, icon_pixmap, label

WEEKDAYS = ["дүйсенбі", "сейсенбі", "сәрсенбі", "бейсенбі", "жұма", "сенбі", "жексенбі"]


def field(title: str, widget: QWidget):
    box = QVBoxLayout()
    box.setSpacing(6)
    box.addWidget(label(title, "FieldLabel"))
    box.addWidget(widget)
    return box


def set_error(widget: QWidget, on: bool):
    widget.setProperty("error", on)
    widget.style().unpolish(widget)
    widget.style().polish(widget)


class AppointmentDialog(QDialog):
    """Жаңа жазылу (record=None) немесе бар жазбаны өңдеу.

    Python логикасы:
      self.btn_save.clicked  -> self.save()   (add_appointment / update_appointment)
      self.doctor / self.date өзгерсе -> self.load_free_slots()
      self.btn_delete.clicked -> confirm_delete()
    """

    def __init__(self, db, parent=None, record=None, doctor_id=None, date=None, time=None):
        super().__init__(parent)
        self.db, self.record = db, record
        self.deleted = False
        edit = record is not None
        self.setWindowTitle("MediCenter Desktop — " + ("Жазбаны өңдеу" if edit else "Жаңа жазылу"))
        self.setModal(True)
        self.setMinimumWidth(620)
        root = QVBoxLayout(self)
        root.setContentsMargins(24, 24, 24, 24)
        root.setSpacing(14)

        # Тақырып
        head = QHBoxLayout()
        head.setSpacing(14)
        ic = QLabel()
        ic.setFixedSize(44, 44)
        ic.setAlignment(Qt.AlignCenter)
        ic.setPixmap(icon_pixmap("edit" if edit else "calendar", c("primary"), 22))
        ic.setStyleSheet(f"background:{c('soft')}; border-radius:12px;")
        head.addWidget(ic)
        tcol = QVBoxLayout()
        tcol.setSpacing(2)
        tcol.addWidget(label(f"Жазбаны өңдеу · #{record['id']:02d}" if edit else "Жаңа жазылу", "H1"))
        tcol.addWidget(label("Барлық міндетті (*) өрістерді толтырыңыз", "Muted"))
        head.addLayout(tcol, 1)
        root.addLayout(head)
        root.addWidget(self._line())

        # Өрістер
        self.patient = QLineEdit(placeholderText="Мысалы: Айгерім Сәрсенова")
        self.iin = QLineEdit(placeholderText="12 сан")
        self.iin.setMaxLength(12)
        self.phone = QLineEdit(placeholderText="+7 7XX XXX XXXX")
        self.doctor = QComboBox()
        for d in db.doctors():
            self.doctor.addItem(f"{d['name']} · {d['specialty']}", d["id"])
        self.date = QDateEdit(calendarPopup=True)
        self.date.setDisplayFormat("dd.MM.yyyy")
        self.date.setMinimumDate(QDate.currentDate().addDays(-365))
        self.complaint = QTextEdit()
        self.complaint.setFixedHeight(68)
        self.complaint.setPlaceholderText("Шағымы немесе қабылдау себебі")

        root.addLayout(field("Пациенттің аты-жөні *", self.patient))
        row = QHBoxLayout()
        row.setSpacing(16)
        row.addLayout(field("ЖСН (ИИН) *", self.iin))
        row.addLayout(field("Телефон *", self.phone))
        root.addLayout(row)
        row = QHBoxLayout()
        row.setSpacing(16)
        row.addLayout(field("Дәрігер *", self.doctor), 3)
        row.addLayout(field("Күні *", self.date), 2)
        root.addLayout(row)

        # Бос уақыт слоттары
        sh = QHBoxLayout()
        sh.addWidget(label("Бос уақыт *", "FieldLabel"))
        sh.addStretch()
        self.slot_hint = label("", "Small")
        sh.addWidget(self.slot_hint)
        root.addLayout(sh)
        self.slot_group = QButtonGroup(self)
        grid = QGridLayout()
        grid.setSpacing(8)
        self.slot_buttons = {}
        for i, s in enumerate(SLOTS):
            b = QPushButton(s)
            b.setProperty("kind", "slot")
            b.setCheckable(True)
            b.setCursor(Qt.PointingHandCursor)
            self.slot_group.addButton(b)
            grid.addWidget(b, i // 7, i % 7)
            self.slot_buttons[s] = b
        root.addLayout(grid)

        if edit:
            self.status = Segmented(["Күтуде", "Келді", "Бас тартты"], record["status"] if record["status"] != "Жаңа" else "Күтуде")
            root.addLayout(field("Статус", self.status))
        root.addLayout(field("Шағымы", self.complaint))
        self.error = label("", "ErrorText", wrap=True)
        self.error.hide()
        root.addWidget(self.error)
        root.addWidget(self._line())

        # Батырмалар
        foot = QHBoxLayout()
        if edit:
            self.btn_delete = button("Жою", "danger", "trash", "btn_delete")
            self.btn_delete.clicked.connect(self.confirm_delete)
            foot.addWidget(self.btn_delete)
        else:
            foot.addWidget(label("Ctrl+Enter — сақтау", "Small"))
        foot.addStretch()
        self.btn_cancel = button("Бас тарту", "secondary", name="btn_cancel")
        self.btn_save = button("Сақтау", "primary", "check", "btn_save")
        self.btn_cancel.clicked.connect(self.reject)
        self.btn_save.clicked.connect(self.save)
        foot.addWidget(self.btn_cancel)
        foot.addWidget(self.btn_save)
        root.addLayout(foot)
        QShortcut(QKeySequence("Ctrl+Return"), self, activated=self.save)

        # Мәндерді толтыру
        if edit:
            self.patient.setText(record["patient"])
            self.iin.setText(record["iin"])
            self.phone.setText(record["phone"])
            self.complaint.setPlainText(record.get("complaint") or "")
            doctor_id, date, time = record["doctor_id"], record["date"], record["time"]
        self.doctor.setCurrentIndex(max(self.doctor.findData(doctor_id), 0) if doctor_id else 0)
        self.date.setDate(QDate.fromString(date, "yyyy-MM-dd") if date else QDate.currentDate())
        self.load_free_slots()
        if time and time in self.slot_buttons and self.slot_buttons[time].isEnabled():
            self.slot_buttons[time].setChecked(True)
        self.doctor.currentIndexChanged.connect(self.load_free_slots)
        self.date.dateChanged.connect(self.load_free_slots)

    def _line(self):
        ln = QFrame()
        ln.setFixedHeight(1)
        ln.setStyleSheet(f"background:{c('border')};")
        return ln

    def load_free_slots(self):
        """Таңдалған дәрігер мен күн бойынша бос емес слоттарды өшіреді."""
        busy = self.db.busy_slots(self.doctor.currentData(), self.date.date().toString("yyyy-MM-dd"),
                                  self.record["id"] if self.record else None)
        for s, b in self.slot_buttons.items():
            b.setEnabled(s not in busy)
            if s in busy and b.isChecked():
                self.slot_group.setExclusive(False)
                b.setChecked(False)
                self.slot_group.setExclusive(True)
        d = self.date.date()
        self.slot_hint.setText(f"{d.toString('dd.MM.yyyy')}, {WEEKDAYS[d.dayOfWeek() - 1]} · бос {len(SLOTS) - len(busy)} / {len(SLOTS)}")

    def validate(self):
        errors = []
        checks = [
            (self.patient, len(self.patient.text().split()) >= 2, "Аты-жөнін толық жазыңыз"),
            (self.iin, bool(re.fullmatch(r"\d{12}", self.iin.text().replace(" ", ""))), "ЖСН 12 саннан тұрады"),
            (self.phone, len(re.sub(r"\D", "", self.phone.text())) == 11, "Телефон: +7 және 10 сан"),
        ]
        for w, ok, msg in checks:
            set_error(w, not ok)
            if not ok:
                errors.append(msg)
        if not self.slot_group.checkedButton():
            errors.append("Уақытты таңдаңыз")
        return errors

    def data(self):
        return {
            "patient": " ".join(self.patient.text().split()),
            "iin": self.iin.text().replace(" ", ""),
            "phone": self.phone.text().strip(),
            "doctor_id": self.doctor.currentData(),
            "date": self.date.date().toString("yyyy-MM-dd"),
            "time": self.slot_group.checkedButton().text(),
            "complaint": self.complaint.toPlainText().strip(),
            "status": self.status.value() if self.record else "Күтуде",
        }

    def save(self):
        errors = self.validate()
        if errors:
            self.error.setText("Өріс бос немесе қате: " + "; ".join(errors))
            self.error.show()
            return
        try:
            if self.record:
                self.db.update_appointment(self.record["id"], self.data())
            else:
                self.new_id = self.db.add_appointment(self.data())
        except Exception as e:  # мысалы UNIQUE(doctor_id, date, time)
            self.error.setText(f"Сақтау мүмкін болмады: {e}")
            self.error.show()
            return
        self.accept()

    def confirm_delete(self):
        if confirm_delete(self, self.record):
            self.db.delete_appointment(self.record["id"])
            self.deleted = True
            self.accept()


def confirm_delete(parent, record) -> bool:
    """Figma 05b: «Жоюды растайсыз ба?»"""
    box = QMessageBox(parent)
    box.setWindowTitle("Жоюды растау")
    box.setIconPixmap(icon_pixmap("trash", c("danger"), 40))
    box.setText("<b style='font-size:17px'>Жоюды растайсыз ба?</b>")
    d = QDate.fromString(record["date"], "yyyy-MM-dd").toString("dd.MM.yyyy")
    box.setInformativeText(f"«{record['patient']} · {d}, {record['time']}» жазбасы біржола өшіріледі. Бұл әрекетті қайтару мүмкін емес.")
    no = box.addButton("Жоқ, қалдыру", QMessageBox.RejectRole)
    yes = box.addButton("Иә, жою", QMessageBox.AcceptRole)
    yes.setProperty("kind", "danger")
    no.setProperty("kind", "secondary")
    box.setDefaultButton(no)
    box.exec()
    return box.clickedButton() is yes
