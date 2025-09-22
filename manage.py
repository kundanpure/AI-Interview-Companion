from flask import current_app
from flask.cli import FlaskGroup
from backend.app import create_app, db
from backend.models import User, Interview

app = create_app()
cli = FlaskGroup(create_app=lambda: app)

if __name__ == '__main__':
    cli()