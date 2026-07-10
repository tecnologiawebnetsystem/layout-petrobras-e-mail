from __future__ import annotations

from datetime import UTC, datetime, timedelta
from types import SimpleNamespace

from app.core.config import settings
from app.api.v1 import routes_cav4_auth as cav4_routes
from app.models.user import TypeUser
from app.utils.session_jwt import create_session_jwt


def test_cav4_login_requires_auth_mode(client):
    response = client.get("/api/v1/auth/cav4/login")
    assert response.status_code == 403
    assert "AUTH_MODE" in response.json()["detail"]


def test_cav4_login_redirect_when_mode_enabled(client, monkeypatch):
    monkeypatch.setattr(settings, "auth_mode", "cav4")
    monkeypatch.setattr(cav4_routes, "generate_pkce", lambda: ("verifier", "challenge"))
    monkeypatch.setattr(
        cav4_routes,
        "get_authorization_url",
        lambda state, nonce, code_challenge: (
            f"https://ca.example.com/auth?state={state}&nonce={nonce}&code_challenge={code_challenge}"
        ),
    )

    response = client.get("/api/v1/auth/cav4/login", follow_redirects=False)
    assert response.status_code == 302
    assert response.headers["location"].startswith("https://ca.example.com/auth?")


def test_cav4_token_exchange_fails_with_invalid_state(client, monkeypatch):
    monkeypatch.setattr(settings, "auth_mode", "cav4")
    cav4_routes._PENDING_AUTH.clear()

    response = client.post(
        "/api/v1/auth/cav4/token",
        json={"code": "abc", "state": "nao-existe"},
    )
    assert response.status_code == 401
    assert "state invalido" in response.json()["detail"].lower()


def test_cav4_token_exchange_success_contract(client, monkeypatch):
    monkeypatch.setattr(settings, "auth_mode", "cav4")

    state = "estado-teste"
    cav4_routes._PENDING_AUTH.clear()
    cav4_routes._PENDING_AUTH[state] = {
        "code_verifier": "verifier-teste",
        "nonce": "nonce-teste",
        "expires_at": datetime.now(UTC) + timedelta(minutes=5),
    }

    monkeypatch.setattr(
        cav4_routes,
        "exchange_code_for_tokens",
        lambda code, code_verifier: {"id_token": "id-token", "access_token": "access-token"},
    )
    monkeypatch.setattr(
        cav4_routes,
        "validate_cav4_id_token",
        lambda _id: {
            "nonce": "nonce-teste",
            "name": "Usuario CAv4",
            "email": "usuario@petrobras.com.br",
            "user_login": "GFZ3",
        },
    )
    monkeypatch.setattr(cav4_routes, "extract_user_login", lambda _: "GFZ3")
    monkeypatch.setattr(cav4_routes, "get_cav4_roles", lambda login, access_token: ["admin"])
    monkeypatch.setattr(
        cav4_routes,
        "resolve_access_from_cav4_roles",
        lambda roles: {
            "authorized": True,
            "role": "admin",
            "is_admin": True,
            "is_supervisor": False,
            "source": "cav4_roles",
        },
    )

    fake_user = SimpleNamespace(
        id=99,
        name="Usuario CAv4",
        email="usuario@petrobras.com.br",
        is_supervisor=False,
        is_admin=True,
        department="TI",
        job_title="Analista",
        employee_id="GFZ3",
        photo_url="",
        manager_id=None,
        status=True,
    )

    monkeypatch.setattr(cav4_routes, "sync_user_from_access", lambda **kwargs: fake_user)
    monkeypatch.setattr(
        cav4_routes,
        "issue_internal_tokens",
        lambda session, user, request, *args, **kwargs: {
            "access_token": "jwt-interno",
            "refresh_token": "refresh-interno",
            "expires_in": 3600,
            "token_type": "bearer",
        },
    )
    monkeypatch.setattr(cav4_routes, "resolve_primary_role", lambda user: "admin")
    monkeypatch.setattr(cav4_routes, "log_event", lambda **kwargs: None)

    response = client.post(
        "/api/v1/auth/cav4/token",
        json={"code": "codigo-oidc", "state": state},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["access_token"] == "jwt-interno"
    assert data["refresh_token"] == "refresh-interno"
    assert data["token_type"] == "bearer"
    assert data["user"]["id"] == 99
    assert data["user"]["role"] == "admin"
    assert data["user"]["is_admin"] is True


def test_cav4_graph_me_returns_graph_payload(client, monkeypatch, session):
    monkeypatch.setattr(settings, "auth_mode", "cav4")

    user = cav4_routes.User(
        id=7,
        name="Usuaria Teste",
        email="usuaria@petrobras.com.br",
        type=TypeUser.INTERNAL,
        status=True,
        login_cav4="GFZ3",
        employee_id="GFZ3",
    )
    session.add(user)
    session.commit()

    token = create_session_jwt(
        user_id=user.id,
        email=user.email,
        user_type=user.type,
        is_supervisor=False,
        is_admin=False,
        expires_minutes=60,
    )

    monkeypatch.setattr(
        cav4_routes,
        "enrich_graph_profile_by_upn",
        lambda upn, employee_id=None: {
            "job_title": "Analista",
            "department": "TI",
            "employee_id": employee_id,
            "login_cav4": employee_id,
            "manager_email": "gestora@petrobras.com.br",
            "manager_name": "Gestora Teste",
            "manager_job_title": "Gerente",
            "manager_employee_id": "GM01",
            "photo_url": None,
        },
    )

    response = client.get(
        "/api/v1/auth/cav4/graph-me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["user"]["email"] == "usuaria@petrobras.com.br"
    assert data["graph"]["manager_job_title"] == "Gerente"