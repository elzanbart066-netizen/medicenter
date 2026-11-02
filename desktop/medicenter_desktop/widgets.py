"""Figma компоненттерінің PySide6 нұсқалары: Button, Status chip, Card, Toast, Sidebar, ECG, графиктер."""
import math

from PySide6.QtCore import QByteArray, QPointF, QRectF, QSize, Qt, QTimer, Signal
from PySide6.QtGui import QBrush, QColor, QFont, QIcon, QLinearGradient, QPainter, QPainterPath, QPen, QPixmap
from PySide6.QtSvg import QSvgRenderer
from PySide6.QtWidgets import (QButtonGroup, QCheckBox, QFrame, QHBoxLayout, QLabel, QPushButton, QSizePolicy,
                               QVBoxLayout, QWidget)

from .theme import STATUS_KEYS, c, qc

# Lucide иконкалары (Figma-дағыдай)
ICONS = {
    "grid": '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
    "calendar": '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    "user": '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    "users": '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    "chart": '<path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/>',
    "logout": '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
    "plus": '<path d="M12 5v14M5 12h14"/>',
    "search": '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    "check": '<path d="M20 6 9 17l-5-5"/>',
    "clock": '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    "x": '<path d="M18 6 6 18M6 6l12 12"/>',
    "edit": '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
    "trash": '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    "download": '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    "chevronL": '<path d="m15 18-6-6 6-6"/>',
    "chevronR": '<path d="m9 18 6-6-6-6"/>',
    "moon": '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    "heart": '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/>',
    "trend": '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
    "lock": '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    "pulse": '<path d="M2 12h4l2.5-6 4 12 3-8 1.5 2H22"/>',
    "alert": '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
}


def icon_pixmap(name: str, color: str, size: int = 18, stroke: float = 2) -> QPixmap:
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" '
           f'stroke="{color}" stroke-width="{stroke}" stroke-linecap="round" stroke-linejoin="round">{ICONS[name]}</svg>')
    ratio = 2
    pm = QPixmap(size * ratio, size * ratio)
    pm.fill(Qt.transparent)
    p = QPainter(pm)
    QSvgRenderer(QByteArray(svg.encode())).render(p)
    p.end()
    pm.setDevicePixelRatio(ratio)
    return pm


def icon(name: str, color: str, size: int = 18, stroke: float = 2) -> QIcon:
    return QIcon(icon_pixmap(name, color, size, stroke))


def label(text: str = "", obj: str = None, wrap: bool = False) -> QLabel:
    lb = QLabel(text)
    if obj:
        lb.setObjectName(obj)
    lb.setWordWrap(wrap)
    return lb


def button(text: str, kind: str = "primary", icon_name: str = None, name: str = None) -> QPushButton:
    """Figma: Button (Type=Primary/Secondary/Danger/Ghost)."""
    b = QPushButton(text)
    b.setProperty("kind", kind)
    b.setCursor(Qt.PointingHandCursor)
    if name:
        b.setObjectName(name)
    if icon_name:
        b.setIcon(icon(icon_name, "#FFFFFF" if kind in ("primary", "danger") else c("text_primary"), 18, 2.2))
        b.setIconSize(QSize(18, 18))
    return b


def icon_button(icon_name: str, color_key: str = "text_secondary", tip: str = "") -> QPushButton:
    b = QPushButton()
    b.setProperty("kind", "icon")
    b.setIcon(icon(icon_name, c(color_key), 16))
    b.setIconSize(QSize(16, 16))
    b.setFixedSize(30, 30)
    b.setToolTip(tip)
    b.setCursor(Qt.PointingHandCursor)
    return b


class Card(QFrame):
    """Figma: ақ карта, 16px радиус, жұқа шекара."""

    def __init__(self, parent=None, padding=(16, 16, 16, 16), spacing=10, horizontal=False):
        super().__init__(parent)
        self.setObjectName("Card")
        self.lay = QHBoxLayout(self) if horizontal else QVBoxLayout(self)
        self.lay.setContentsMargins(*padding)
        self.lay.setSpacing(spacing)


class StatusChip(QLabel):
    """Figma: Status chip (Келді / Күтуде / Бас тартты / Жаңа)."""

    def __init__(self, status: str, parent=None):
        super().__init__(parent)
        self.set_status(status)

    def set_status(self, status: str):
        self.status = status
        fg, bg = STATUS_KEYS.get(status, ("primary", "soft"))
        self.setText(f"●  {status}")
        self.setStyleSheet(f"background:{c(bg)}; color:{c(fg)}; border-radius:9px; padding:3px 10px; font-size:12px; font-weight:600;")
        self.setSizePolicy(QSizePolicy.Fixed, QSizePolicy.Fixed)


class Avatar(QLabel):
    def __init__(self, name: str, size: int = 32, parent=None):
        super().__init__(parent)
        ini = "".join(w[0] for w in name.split()[:2]).upper()
        self.setText(ini)
        self.setFixedSize(size, size)
        self.setAlignment(Qt.AlignCenter)
        self.setStyleSheet(f"background:{c('soft')}; color:{c('navy')}; border-radius:{size // 2}px; font-weight:700; font-size:{int(size * 0.36)}px;")


class EcgLine(QWidget):
    """Бренд элементі: кардиограмма сызығы (логотип, карталар, кіру терезесі)."""
    PTS = [(0, 30), (120, 30), (132, 30), (142, 6), (156, 54), (168, 16), (176, 30), (250, 30), (262, 30), (272, 14), (284, 46), (294, 30), (400, 30)]

    def __init__(self, color_key="primary", width=84, height=28, stroke=2.0, color=None, parent=None):
        super().__init__(parent)
        self.color_key, self.color, self.stroke = color_key, color, stroke
        self.setFixedSize(width, height)

    def paintEvent(self, _):
        p = QPainter(self)
        p.setRenderHint(QPainter.Antialiasing)
        w, h = self.width(), self.height()
        path = QPainterPath()
        for i, (x, y) in enumerate(self.PTS):
            pt = QPointF(x / 400 * (w - 4) + 2, y / 60 * (h - 4) + 2)
            path.moveTo(pt) if i == 0 else path.lineTo(pt)
        pen = QPen(QColor(self.color) if self.color else qc(self.color_key), self.stroke)
        pen.setCapStyle(Qt.RoundCap)
        pen.setJoinStyle(Qt.RoundJoin)
        p.setPen(pen)
        p.drawPath(path)


class LogoMark(QWidget):
    def __init__(self, size=34, parent=None):
        super().__init__(parent)
        self.setFixedSize(size, size)

    def paintEvent(self, _):
        p = QPainter(self)
        p.setRenderHint(QPainter.Antialiasing)
        s = self.width()
        p.setBrush(QColor("#06B6D4"))
        p.setPen(Qt.NoPen)
        p.drawRoundedRect(QRectF(0, 0, s, s), s * 0.3, s * 0.3)
        p.drawPixmap(int(s * 0.15), int(s * 0.15), icon_pixmap("pulse", "#FFFFFF", int(s * 0.7), 2.4))


class Segmented(QFrame):
    """Figma: сегменттелген басқару (рөл, статус, Апта/Күн)."""
    changed = Signal(str)

    def __init__(self, options, current=None, parent=None):
        super().__init__(parent)
        self.setObjectName("Segmented")
        lay = QHBoxLayout(self)
        lay.setContentsMargins(4, 4, 4, 4)
        lay.setSpacing(4)
        self.group = QButtonGroup(self)
        self.buttons = {}
        for opt in options:
            b = QPushButton(opt)
            b.setCheckable(True)
            b.setCursor(Qt.PointingHandCursor)
            self.group.addButton(b)
            lay.addWidget(b)
            self.buttons[opt] = b
        self.set_value(current or options[0])
        self.group.buttonClicked.connect(lambda b: self.changed.emit(b.text()))

    def value(self) -> str:
        b = self.group.checkedButton()
        return b.text() if b else ""

    def set_value(self, v: str):
        if v in self.buttons:
            self.buttons[v].setChecked(True)


class StatCard(Card):
    """Figma: Stat карта (атау, иконка, үлкен сан, ECG спарклайн)."""

    def __init__(self, title, icon_name, color_key, soft_key, parent=None):
        super().__init__(parent, spacing=8)
        self.color_key, self.soft_key, self.icon_name = color_key, soft_key, icon_name
        top = QHBoxLayout()
        top.addWidget(label(title, "Muted"))
        top.addStretch()
        self.ic = QLabel()
        self.ic.setFixedSize(32, 32)
        self.ic.setAlignment(Qt.AlignCenter)
        top.addWidget(self.ic)
        self.lay.addLayout(top)
        bottom = QHBoxLayout()
        col = QVBoxLayout()
        col.setSpacing(0)
        self.value = label("0", "Big")
        self.sub = label("", "Small")
        col.addWidget(self.value)
        col.addWidget(self.sub)
        bottom.addLayout(col)
        bottom.addStretch()
        self.ecg = EcgLine(color_key, 84, 28)
        bottom.addWidget(self.ecg, 0, Qt.AlignBottom)
        self.lay.addLayout(bottom)
        self.restyle()

    def restyle(self):
        self.ic.setPixmap(icon_pixmap(self.icon_name, c(self.color_key), 16, 2.4))
        self.ic.setStyleSheet(f"background:{c(self.soft_key)}; border-radius:10px;")
        self.sub.setStyleSheet(f"color:{c(self.color_key)}; font-weight:600;")

    def set(self, value, sub):
        self.value.setText(str(value))
        self.sub.setText(sub)


class QueueBar(QWidget):
    """Figma: «Бүгінгі кезек» прогресс сызығы (келді / бас тартты / күтуде)."""

    def __init__(self, parent=None):
        super().__init__(parent)
        self.parts = []
        self.setFixedHeight(12)

    def set_parts(self, parts):
        self.parts = parts  # [(count, color_key)]
        self.update()

    def paintEvent(self, _):
        p = QPainter(self)
        p.setRenderHint(QPainter.Antialiasing)
        total = sum(n for n, _ in self.parts) or 1
        clip = QPainterPath()
        clip.addRoundedRect(QRectF(self.rect()), 6, 6)
        p.setClipPath(clip)
        p.fillRect(self.rect(), qc("bg_subtle"))
        x = 0.0
        for n, key in self.parts:
            if not n:
                continue
            w = n / total * self.width()
            p.fillRect(QRectF(x, 0, max(w - 3, 1), self.height()), qc(key))
            x += w


class BarChart(QWidget):
    """Figma: «Айлық жазылулар» бағаналы диаграммасы (QPainter, QtCharts қажет емес)."""

    def __init__(self, parent=None):
        super().__init__(parent)
        self.values, self.labels, self.current = [], [], -1
        self.setMinimumHeight(220)

    def set_data(self, values, labels, current):
        self.values, self.labels, self.current = values, labels, current
        self.update()

    def paintEvent(self, _):
        if not self.values:
            return
        p = QPainter(self)
        p.setRenderHint(QPainter.Antialiasing)
        left, bottom, top = 36, 22, 18
        h = self.height() - bottom - top
        w = self.width() - left
        vmax = max(max(self.values), 1)
        step = 10 ** max(len(str(int(vmax))) - 1, 0)
        vmax = math.ceil(vmax / step) * step
        small = QFont(self.font())
        small.setPointSizeF(8)
        p.setFont(small)
        for frac in (0, 0.5, 1):
            y = top + h * (1 - frac)
            p.setPen(QPen(qc("border"), 1))
            p.drawLine(QPointF(left, y), QPointF(self.width(), y))
            p.setPen(qc("text_secondary"))
            p.drawText(QRectF(0, y - 8, left - 6, 16), Qt.AlignRight | Qt.AlignVCenter, str(int(vmax * frac)))
        n = len(self.values)
        slot = w / n
        bw = min(slot * 0.62, 40)
        for i, v in enumerate(self.values):
            x = left + i * slot + (slot - bw) / 2
            bh = v / vmax * h
            cur = i == self.current
            p.setPen(Qt.NoPen)
            p.setBrush(qc("primary") if cur else qc("mint", 170 if i <= self.current else 60))
            path = QPainterPath()
            path.addRoundedRect(QRectF(x, top + h - bh, bw, bh), 6, 6)
            p.drawPath(path)
            p.setPen(qc("navy") if cur else qc("text_secondary"))
            if v:
                p.drawText(QRectF(x - 10, top + h - bh - 16, bw + 20, 14), Qt.AlignCenter, str(v))
            p.setPen(qc("text_primary") if cur else qc("text_secondary"))
            p.drawText(QRectF(x - 10, top + h + 4, bw + 20, 16), Qt.AlignCenter, self.labels[i])


class Donut(QWidget):
    """Figma: «Статус бойынша» сақиналы диаграмма."""

    def __init__(self, parent=None):
        super().__init__(parent)
        self.parts, self.center = [], ""
        self.setFixedSize(170, 170)

    def set_data(self, parts, center):
        self.parts, self.center = parts, center
        self.update()

    def paintEvent(self, _):
        p = QPainter(self)
        p.setRenderHint(QPainter.Antialiasing)
        r = QRectF(12, 12, self.width() - 24, self.height() - 24)
        total = sum(n for n, _ in self.parts) or 1
        start = 90 * 16
        for n, key in self.parts:
            span = -int(n / total * 360 * 16)
            pen = QPen(qc(key), 20)
            pen.setCapStyle(Qt.FlatCap)
            p.setPen(pen)
            gap = 2 * 16  # сегменттер арасында 2° саңылау
            p.drawArc(r, start - gap // 2, span + gap if span < -2 * gap else span)
            start += span
        p.setPen(qc("text_primary"))
        f = QFont(self.font())
        f.setPointSize(20)
        f.setBold(True)
        p.setFont(f)
        p.drawText(QRectF(0, 0, self.width(), self.height() - 14), Qt.AlignCenter, self.center)
        f.setPointSize(9)
        f.setBold(False)
        p.setFont(f)
        p.setPen(qc("text_secondary"))
        p.drawText(QRectF(0, 30, self.width(), self.height() - 14), Qt.AlignCenter, "жазылу")


class Toast(QFrame):
    """Figma: Toast («Сәтті сақталды»). 2.8 секундтан кейін өзі жасырылады."""

    def __init__(self, parent):
        super().__init__(parent)
        self.setObjectName("Toast")
        lay = QHBoxLayout(self)
        lay.setContentsMargins(14, 12, 20, 12)
        lay.setSpacing(12)
        self.ic = QLabel()
        self.ic.setFixedSize(32, 32)
        self.ic.setAlignment(Qt.AlignCenter)
        lay.addWidget(self.ic)
        col = QVBoxLayout()
        col.setSpacing(2)
        self.title = label("", "H2")
        self.msg = label("", "Small")
        col.addWidget(self.title)
        col.addWidget(self.msg)
        lay.addLayout(col)
        self.timer = QTimer(self, singleShot=True, interval=2800, timeout=self.hide)
        self.hide()

    def show_message(self, title, message, kind="success"):
        key, soft = ("success", "success_soft") if kind == "success" else ("danger", "danger_soft")
        self.ic.setPixmap(icon_pixmap("check" if kind == "success" else "trash", c(key), 18, 2.6))
        self.ic.setStyleSheet(f"background:{c(soft)}; border-radius:16px;")
        self.setStyleSheet(f"#Toast {{ border-left: 4px solid {c(key)}; }}")
        self.title.setText(title)
        self.msg.setText(message)
        self.adjustSize()
        par = self.parentWidget()
        self.move(par.width() - self.width() - 24, 20)
        self.raise_()
        self.show()
        self.timer.start()


class Sidebar(QFrame):
    """Figma: Sidebar (Active=Басты бет / Жазылулар / Дәрігерлер / Статистика)."""
    navigate = Signal(int)
    theme_toggled = Signal(bool)
    logout = Signal()
    PAGES = [("grid", "Басты бет"), ("calendar", "Жазылулар"), ("users", "Дәрігерлер"), ("chart", "Статистика")]

    def __init__(self, user: dict, dark: bool, parent=None):
        super().__init__(parent)
        self.setObjectName("Sidebar")
        self.setFixedWidth(232)
        lay = QVBoxLayout(self)
        lay.setContentsMargins(14, 20, 14, 16)
        lay.setSpacing(4)
        brand = QHBoxLayout()
        brand.setContentsMargins(6, 0, 6, 14)
        brand.setSpacing(10)
        brand.addWidget(LogoMark(34))
        bcol = QVBoxLayout()
        bcol.setSpacing(0)
        bcol.addWidget(label("MediCenter", "BrandName"))
        bcol.addWidget(label("DESKTOP · Тіркеу бөлімі", "BrandSub"))
        brand.addLayout(bcol)
        lay.addLayout(brand)
        lay.addWidget(label("НЕГІЗГІ", "SectionLabel"))
        self.group = QButtonGroup(self)
        self.nav = []
        for i, (ic, text) in enumerate(self.PAGES):
            b = QPushButton("  " + text)
            b.setObjectName("NavButton")
            b.setCheckable(True)
            b.setCursor(Qt.PointingHandCursor)
            b.setIconSize(QSize(18, 18))
            b._icon = ic
            self.group.addButton(b, i)
            lay.addWidget(b)
            self.nav.append(b)
        self.group.idClicked.connect(self._on_nav)
        lay.addStretch()
        tg = QFrame()
        tg.setObjectName("ThemeToggle")
        tl = QHBoxLayout(tg)
        tl.setContentsMargins(12, 8, 12, 8)
        moon = QLabel()
        moon.setPixmap(icon_pixmap("moon", "#7EE7DB", 16))
        tl.addWidget(moon)
        self.dark_check = QCheckBox("Қараңғы режим")
        self.dark_check.setChecked(dark)
        self.dark_check.toggled.connect(self.theme_toggled.emit)
        tl.addWidget(self.dark_check, 1)
        lay.addWidget(tg)
        lay.addSpacing(6)
        uc = QFrame()
        uc.setObjectName("UserCard")
        ul = QHBoxLayout(uc)
        ul.setContentsMargins(10, 10, 10, 10)
        ul.setSpacing(10)
        av = QLabel("".join(w[0] for w in user["full_name"].split()[:2]))
        av.setFixedSize(36, 36)
        av.setAlignment(Qt.AlignCenter)
        av.setStyleSheet("background:#7EE7DB; color:#0E3A6B; border-radius:18px; font-weight:700;")
        ul.addWidget(av)
        ucol = QVBoxLayout()
        ucol.setSpacing(1)
        ucol.addWidget(label(user["full_name"], "UserName"))
        ucol.addWidget(label(user["role"], "Small"))
        ul.addLayout(ucol, 1)
        out = QPushButton()
        out.setObjectName("LogoutButton")
        out.setIcon(icon("logout", "#B9D3EE", 18))
        out.setToolTip("Жүйеден шығу")
        out.setCursor(Qt.PointingHandCursor)
        out.clicked.connect(self.logout.emit)
        ul.addWidget(out)
        lay.addWidget(uc)
        self.set_current(0)

    def _on_nav(self, i):
        self.set_current(i)
        self.navigate.emit(i)

    def set_current(self, i):
        self.nav[i].setChecked(True)
        for j, b in enumerate(self.nav):
            b.setIcon(icon(b._icon, "#FFFFFF" if j == i else "#B9D3EE", 18))


class LoginBrandPanel(QWidget):
    """Кіру терезесінің сол жағы: градиент, қазақ оюы (қошқар мүйіз), ECG."""

    def paintEvent(self, _):
        p = QPainter(self)
        p.setRenderHint(QPainter.Antialiasing)
        g = QLinearGradient(0, 0, self.width(), self.height())
        g.setColorAt(0, QColor("#0E3A6B"))
        g.setColorAt(0.65, QColor("#0B5E8C"))
        g.setColorAt(1, QColor("#06B6D4"))
        p.fillRect(self.rect(), QBrush(g))
        # ою-өрнек: 7% мөлдірлік
        pen = QPen(QColor(255, 255, 255, 18), 2.5)
        pen.setCapStyle(Qt.RoundCap)
        p.setPen(pen)
        p.setBrush(Qt.NoBrush)
        for r in range(0, self.height() // 100 + 2):
            for col in range(0, self.width() // 100 + 2):
                ox, oy = col * 100 + (50 if r % 2 else 0) - 20, r * 100 - 10
                path = QPainterPath()
                for s in (1, -1):
                    path.moveTo(ox + 50, oy + 80)
                    path.cubicTo(ox + 50, oy + 56, ox + 50 - 32 * s, oy + 58, ox + 50 - 32 * s, oy + 36)
                    path.cubicTo(ox + 50 - 32 * s, oy + 20, ox + 50 - 14 * s, oy + 16, ox + 50 - 8 * s, oy + 28)
                    path.cubicTo(ox + 50 - 4 * s, oy + 36, ox + 50 - 12 * s, oy + 42, ox + 50 - 17 * s, oy + 38)
                path.moveTo(ox + 50, oy + 6)
                path.lineTo(ox + 58, oy + 16)
                path.lineTo(ox + 50, oy + 26)
                path.lineTo(ox + 42, oy + 16)
                path.closeSubpath()
                p.drawPath(path)
