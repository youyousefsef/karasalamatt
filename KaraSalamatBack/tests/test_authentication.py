import pytest
from unittest.mock import patch
from models import AdminReg, HSEReg, User, VerfyOTPCode
from routers.authentication import hash_otp


class TestGenerateOTP:
    def test_phone_not_found_returns_404(self, client):
        response = client.post("/auth/generate-otp", json={"phone_number": "09123456789"})
        assert response.status_code == 404

    def test_admin_phone_generates_otp(self, client, db_session):
        db_session.add(AdminReg(phone_num="09123456789"))
        db_session.commit()

        response = client.post("/auth/generate-otp", json={"phone_number": "09123456789"})
        assert response.status_code == 200
        data = response.json()
        assert data["ok"] is True
        assert data["phone_number"] == "09123456789"

    def test_hse_phone_generates_otp(self, client, db_session):
        admin = AdminReg(phone_num="09120000000")
        db_session.add(admin)
        db_session.commit()
        db_session.add(HSEReg(phone_num="09123456788", owner_id=admin.id))
        db_session.commit()

        response = client.post("/auth/generate-otp", json={"phone_number": "09123456788"})
        assert response.status_code == 200

    def test_cooldown_blocks_rapid_requests(self, client, db_session):
        db_session.add(AdminReg(phone_num="09123456787"))
        db_session.commit()
        client.post("/auth/generate-otp", json={"phone_number": "09123456787"})
        response = client.post("/auth/generate-otp", json={"phone_number": "09123456787"})
        assert response.status_code == 429


class TestVerifyOTP:
    def test_verify_without_generating_otp_returns_400(self, client):
        response = client.post("/auth/verify-otp-and-create-user", json={
            "phone_number": "09123456786",
            "otp_code": "1234",
            "name": "Test",
            "fullname": "User",
        })
        assert response.status_code == 400

    def test_verify_with_wrong_otp_returns_400(self, client, db_session):
        phone = "09123456786"
        db_session.add(AdminReg(phone_num=phone))
        db_session.commit()

        db_session.add(VerfyOTPCode(phone_number=phone, otp_code=hash_otp("4321")))
        db_session.commit()

        response = client.post("/auth/verify-otp-and-create-user", json={
            "phone_number": phone,
            "otp_code": "9999",
            "name": "Test",
            "fullname": "User",
        })
        assert response.status_code == 400

    def test_successful_verification_returns_token(self, client, db_session):
        phone = "09123456785"
        db_session.add(AdminReg(phone_num=phone))
        db_session.commit()

        otp_record = VerfyOTPCode(phone_number=phone, otp_code=hash_otp("1234"))
        db_session.add(otp_record)
        db_session.commit()

        response = client.post("/auth/verify-otp-and-create-user", json={
            "phone_number": phone,
            "otp_code": "1234",
            "name": "Test",
            "fullname": "User",
        })
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "admin"
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_verify_creates_user_in_database(self, client, db_session):
        phone = "09123456784"
        db_session.add(AdminReg(phone_num=phone))
        db_session.commit()
        db_session.add(VerfyOTPCode(phone_number=phone, otp_code=hash_otp("5678")))
        db_session.commit()

        client.post("/auth/verify-otp-and-create-user", json={
            "phone_number": phone,
            "otp_code": "5678",
            "name": "Ali",
            "fullname": "Mohammadi",
        })

        user = db_session.query(User).filter(User.phone_number == phone).first()
        assert user is not None
        assert user.name == "Ali"
        assert user.fullname == "Mohammadi"
        assert user.role == "admin"


class TestSupervisorCRUD:
    def test_add_supervisor_without_auth_returns_401(self, client):
        response = client.post("/auth/add-supervisor", json={
            "phone_number": "09123456783",
            "role": "HSESupervisor",
        })
        assert response.status_code == 401

    def test_admin_can_add_supervisor(self, client, db_session, admin_token):
        db_session.add(AdminReg(phone_num="09120000000"))
        db_session.commit()
        db_session.add(User(phone_number="09120000000", role="admin", sub=1))
        db_session.commit()

        response = client.post(
            "/auth/add-supervisor",
            json={"phone_number": "09123456783", "role": "HSESupervisor"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["phone_num"] == "09123456783"
        assert data["role"] == "HSESupervisor"

    def test_non_admin_cannot_add_supervisor(self, client, user_token):
        response = client.post(
            "/auth/add-supervisor",
            json={"phone_number": "09123456782", "role": "HSESupervisor"},
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert response.status_code == 403

    def test_duplicate_supervisor_returns_400(self, client, db_session, admin_token):
        db_session.add(AdminReg(phone_num="09120000000"))
        db_session.commit()
        db_session.add(User(phone_number="09120000000", role="admin", sub=1))
        db_session.add(HSEReg(phone_num="09123456781", role="HSESupervisor", owner_id=1))
        db_session.commit()

        response = client.post(
            "/auth/add-supervisor",
            json={"phone_number": "09123456781", "role": "HSESupervisor"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 400

    def test_get_supervisors(self, client, db_session, admin_token):
        db_session.add(AdminReg(phone_num="09120000000"))
        db_session.commit()
        db_session.add(HSEReg(phone_num="09123456780", role="HSESupervisor", owner_id=1))
        db_session.commit()

        response = client.get(
            "/auth/get_all_supervisors",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1

    def test_delete_supervisor(self, client, db_session, admin_token):
        db_session.add(AdminReg(phone_num="09120000000"))
        db_session.commit()
        sup = HSEReg(phone_num="09123456779", role="HSESupervisor", owner_id=1)
        db_session.add(sup)
        db_session.commit()

        response = client.delete(
            f"/auth/delete_sup/{sup.id}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 204

    def test_delete_nonexistent_supervisor_returns_404(self, client, admin_token):
        response = client.delete(
            "/auth/delete_sup/9999",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 404


class TestHealthCheck:
    def test_connection_endpoint(self, client):
        response = client.get("/test_connection")
        assert response.status_code in (200, 500)
        data = response.json()
        assert "status" in data
