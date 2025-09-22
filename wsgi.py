# wsgi.py (project root)
from backend.app import create_app, db  # uses your factory
# if you import models somewhere, migrations can autogenerate properly
from backend import models  # noqa: F401

app = create_app()
