from __future__ import annotations

import base64
from pathlib import Path

import streamlit as st
import streamlit.components.v1 as components


ROOT = Path(__file__).parent
DEMO_DIR = ROOT / "Référentiel pays"
HTML_PATH = DEMO_DIR / "public" / "index.html"
ASSETS_DIR = DEMO_DIR / "public" / "assets"


def _data_uri(path: Path) -> str:
    suffix = path.suffix.lower().lstrip(".") or "png"
    payload = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:image/{suffix};base64,{payload}"


@st.cache_data(show_spinner=False)
def load_demo_html() -> str:
    html = HTML_PATH.read_text(encoding="utf-8")

    for asset_name in ("contact-web.png", "contact-linkedin.png", "contact-mail.png"):
        asset_path = ASSETS_DIR / asset_name
        html = html.replace(f'src="assets/{asset_name}"', f'src="{_data_uri(asset_path)}"')

    return html


st.set_page_config(
    page_title="Référentiel pays LCB-FT",
    page_icon="🌍",
    layout="wide",
    initial_sidebar_state="collapsed",
)

st.markdown(
    """
    <style>
      .block-container {
        max-width: none;
        padding: 0;
      }
      header[data-testid="stHeader"],
      div[data-testid="stToolbar"],
      footer {
        display: none;
      }
      iframe {
        display: block;
      }
    </style>
    """,
    unsafe_allow_html=True,
)

components.html(load_demo_html(), height=980, scrolling=True)
