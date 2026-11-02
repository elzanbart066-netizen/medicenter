"""Figma дизайн жүйесінің түстері (Light / Dark) және QSS стилі."""
from string import Template

from PySide6.QtGui import QColor

# Figma: "MediCenter Light" және "MediCenter Dark" айнымалылар коллекциялары
LIGHT = {
    "bg_app": "#F3F6FB", "bg_surface": "#FFFFFF", "bg_subtle": "#EEF4FA", "bg_sidebar": "#0E3A6B",
    "text_primary": "#0F172A", "text_secondary": "#64748B", "text_on_brand": "#FFFFFF", "text_sidebar": "#B9D3EE",
    "border": "#E2E8F0", "border_strong": "#CBD5E1",
    "primary": "#06B6D4", "primary_hover": "#0891B2", "mint": "#7EE7DB", "navy": "#0E3A6B", "soft": "#E0F7FB",
    "success": "#059669", "success_soft": "#D1FAE5", "warning": "#D97706", "warning_soft": "#FEF3C7",
    "danger": "#DC2626", "danger_soft": "#FEE2E2",
}
DARK = {
    "bg_app": "#0B1220", "bg_surface": "#111A2E", "bg_subtle": "#18233A", "bg_sidebar": "#081428",
    "text_primary": "#E6EDF7", "text_secondary": "#94A3B8", "text_on_brand": "#FFFFFF", "text_sidebar": "#8FA6C4",
    "border": "#22304A", "border_strong": "#334766",
    "primary": "#22D3EE", "primary_hover": "#06B6D4", "mint": "#5EEAD4", "navy": "#93C5FD", "soft": "#0E3442",
    "success": "#34D399", "success_soft": "#0F3B2E", "warning": "#FBBF24", "warning_soft": "#3D2F0A",
    "danger": "#F87171", "danger_soft": "#3F1515",
}

# Статус → (түс, фон түсі) кілттері
STATUS_KEYS = {
    "Келді": ("success", "success_soft"),
    "Күтуде": ("warning", "warning_soft"),
    "Бас тартты": ("danger", "danger_soft"),
    "Жаңа": ("primary", "soft"),
}
STATUSES = ["Күтуде", "Келді", "Бас тартты", "Жаңа"]


class Theme:
    dark = False
    colors = LIGHT

    @classmethod
    def set_dark(cls, dark: bool):
        cls.dark = dark
        cls.colors = DARK if dark else LIGHT


def c(name: str) -> str:
    return Theme.colors[name]


def qc(name: str, alpha: int = 255) -> QColor:
    col = QColor(Theme.colors[name])
    col.setAlpha(alpha)
    return col


QSS = Template("""
* { font-family: "Inter", "Segoe UI", "Arial"; font-size: 14px; color: $text_primary; }
QMainWindow, QDialog, #Page, #LoginRight { background: $bg_app; }
#LoginRight { background: $bg_surface; }
QToolTip { background: $navy; color: white; border: none; padding: 6px 8px; border-radius: 6px; }

/* ---------- Sidebar ---------- */
#Sidebar { background: $bg_sidebar; }
#Sidebar QLabel { color: $text_sidebar; background: transparent; }
#Sidebar #BrandName { color: white; font-size: 17px; font-weight: 800; }
#Sidebar #BrandSub { color: $mint; font-size: 10px; font-weight: 600; letter-spacing: 1px; }
#Sidebar #SectionLabel { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; padding: 10px 6px 4px 6px; }
#NavButton { text-align: left; padding: 10px 12px; border: none; border-radius: 10px; color: $text_sidebar; font-weight: 500; background: transparent; }
#NavButton:hover { background: rgba(255,255,255,0.08); }
#NavButton:checked { background: $primary; color: white; font-weight: 600; }
#ThemeToggle, #UserCard { background: rgba(255,255,255,0.07); border-radius: 12px; }
#ThemeToggle QCheckBox { color: $text_sidebar; font-size: 13px; background: transparent; }
#ThemeToggle QCheckBox::indicator { width: 30px; height: 16px; border-radius: 8px; border: none; background: rgba(255,255,255,0.25); }
#ThemeToggle QCheckBox::indicator:checked { background: $primary; }
#UserCard #UserName { color: white; font-weight: 600; font-size: 12px; }
#LogoutButton { background: transparent; border: none; padding: 4px; }
#LogoutButton:hover { background: rgba(255,255,255,0.12); border-radius: 8px; }

/* ---------- Typography ---------- */
#H1 { font-size: 24px; font-weight: 800; }
#H2 { font-size: 15px; font-weight: 700; }
#Muted { color: $text_secondary; font-size: 13px; }
#Small { color: $text_secondary; font-size: 11px; }
#Big { font-size: 30px; font-weight: 800; }
#FieldLabel { color: $text_secondary; font-size: 12px; font-weight: 600; }
#ErrorText { color: $danger; font-size: 12px; font-weight: 500; }
#Link { color: $primary; font-weight: 600; font-size: 13px; background: transparent; border: none; }

/* ---------- Cards ---------- */
#Card { background: $bg_surface; border: 1px solid $border; border-radius: 16px; }
#Card QLabel { background: transparent; }

/* ---------- Buttons ---------- */
QPushButton { border-radius: 10px; padding: 9px 16px; font-weight: 600; border: 1px solid transparent; }
QPushButton[kind="primary"] { background: $primary; color: white; }
QPushButton[kind="primary"]:hover { background: $primary_hover; }
QPushButton[kind="secondary"] { background: $bg_surface; color: $text_primary; border: 1px solid $border_strong; }
QPushButton[kind="secondary"]:hover { background: $bg_subtle; }
QPushButton[kind="danger"] { background: $danger; color: white; }
QPushButton[kind="ghost"] { background: transparent; color: $text_secondary; }
QPushButton[kind="ghost"]:hover { background: $bg_subtle; }
QPushButton[kind="icon"] { background: transparent; padding: 5px; border-radius: 8px; }
QPushButton[kind="icon"]:hover { background: $bg_subtle; }
QPushButton:disabled { opacity: 0.5; }

/* Segmented control (рөл, статус, апта/күн) */
#Segmented { background: $bg_subtle; border-radius: 12px; }
#Segmented QPushButton { background: transparent; border: none; color: $text_secondary; font-weight: 500; padding: 8px 12px; border-radius: 9px; }
#Segmented QPushButton:checked { background: $bg_surface; color: $navy; font-weight: 700; }

/* Уақыт слоттары */
QPushButton[kind="slot"] { background: $bg_surface; border: 1px solid $border_strong; color: $text_primary; font-family: "JetBrains Mono", "Consolas"; font-weight: 500; padding: 7px 0; min-width: 62px; }
QPushButton[kind="slot"]:checked { background: $primary; border-color: $primary; color: white; font-weight: 700; }
QPushButton[kind="slot"]:disabled { background: $bg_subtle; border-color: $bg_subtle; color: $border_strong; text-decoration: line-through; }

/* ---------- Inputs ---------- */
QLineEdit, QComboBox, QDateEdit, QTextEdit {
  background: $bg_surface; border: 1px solid $border_strong; border-radius: 10px; padding: 9px 12px; selection-background-color: $primary;
}
QLineEdit:focus, QComboBox:focus, QDateEdit:focus, QTextEdit:focus { border: 2px solid $primary; padding: 8px 11px; }
QLineEdit[error="true"], QComboBox[error="true"], QTextEdit[error="true"] { border: 2px solid $danger; padding: 8px 11px; }
QComboBox::drop-down, QDateEdit::drop-down { border: none; width: 26px; }
QComboBox QAbstractItemView { background: $bg_surface; border: 1px solid $border; selection-background-color: $soft; selection-color: $text_primary; outline: none; padding: 4px; }
QCheckBox { spacing: 8px; }
QCheckBox::indicator { width: 18px; height: 18px; border-radius: 5px; border: 1px solid $border_strong; background: $bg_surface; }
QCheckBox::indicator:checked { background: $primary; border-color: $primary; }

/* ---------- Tables ---------- */
QTableWidget, QListWidget { background: $bg_surface; border: none; gridline-color: transparent; outline: none; }
QTableWidget::item { border-bottom: 1px solid $border; padding: 0 8px; }
QTableWidget::item:selected { background: $soft; color: $text_primary; }
QHeaderView::section { background: $bg_subtle; color: $text_secondary; border: none; padding: 8px; font-size: 10px; font-weight: 700; letter-spacing: 1px; }
QTableCornerButton::section { background: $bg_subtle; border: none; }
QListWidget::item { border-radius: 12px; padding: 4px; margin: 2px 0; }
QListWidget::item:selected { background: $soft; color: $text_primary; border: 1px solid $primary; }
QListWidget::item:hover:!selected { background: $bg_subtle; }
QScrollBar:vertical { background: transparent; width: 10px; margin: 2px; }
QScrollBar::handle:vertical { background: $border_strong; border-radius: 4px; min-height: 30px; }
QScrollBar::add-line, QScrollBar::sub-line { height: 0; }

/* Дәрігер кестесінің ұяшықтары */
#SlotBusy { background: $soft; border-left: 3px solid $primary; border-radius: 8px; color: $navy; font-size: 12px; font-weight: 600; padding: 4px 8px; }
#SlotLunch { background: $bg_subtle; border-radius: 8px; color: $text_secondary; font-size: 11px; }
#SlotFree { background: transparent; border: 1px dashed $border_strong; border-radius: 8px; color: $text_secondary; font-size: 12px; font-weight: 500; }
#SlotFree:hover { background: $primary; border: 1px solid $primary; color: white; font-weight: 700; }
#SlotPast { background: transparent; border: 1px dashed $border; border-radius: 8px; color: $border_strong; font-size: 11px; }

/* ---------- Toast & Message box ---------- */
#Toast { background: $bg_surface; border: 1px solid $border; border-left: 4px solid $success; border-radius: 12px; }
#Toast QLabel { background: transparent; }
QMessageBox { background: $bg_surface; }
QMessageBox QPushButton { min-width: 110px; background: $bg_subtle; }
QCalendarWidget QWidget { alternate-background-color: $bg_subtle; }
QCalendarWidget QToolButton { color: $text_primary; background: transparent; }
""")


def stylesheet() -> str:
    return QSS.substitute(Theme.colors)
