import os
import sys
from pathlib import Path
from datetime import datetime, timezone

sys.path.insert(0, str(Path(__file__).resolve().parent))

os.environ.setdefault("DATABASE_URL", "postgresql://karasalamat:karasalamat@postgres:5432/karasalamat")
os.environ.setdefault("SECRET_KEY", "7f8a2ef1b079bcaf4675162970b13159e9c274d08cc0d31e6b0815c9582e1cf7")
os.environ["SKIP_MIGRATIONS"] = "true"

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, AdminReg, User

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

Base.metadata.create_all(bind=engine)
print("[+] Tables ensured")

SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

PHONE = "09921337641"

try:
    existing = db.query(AdminReg).filter(AdminReg.phone_num == PHONE).first()
    if existing:
        print(f"[-] Admin {PHONE} already exists in admin_reg (id={existing.id})")
        admin_id = existing.id
    else:
        admin_reg = AdminReg(phone_num=PHONE)
        db.add(admin_reg)
        db.flush()
        admin_id = admin_reg.id
        print(f"[+] Inserted into admin_reg: id={admin_id}, phone={PHONE}")

    existing_user = db.query(User).filter(User.phone_number == PHONE).first()
    if existing_user:
        print(f"[-] User {PHONE} already exists in users (id={existing_user.id})")
    else:
        user = User(
            name="Admin",
            fullname="مدیر سیستم",
            phone_number=PHONE,
            role="admin",
            sub=admin_id,
            created_at=datetime.now(timezone.utc),
        )
        db.add(user)
        db.commit()
        print(f"[+] Inserted into users: id={user.id}, role=admin, phone={PHONE}")

except Exception as e:
    db.rollback()
    print(f"[-] Error: {e}")
    sys.exit(1)
finally:
    db.close()

print("\n[+] Seeding complete!")
print(f"    Phone:    {PHONE}")
print(f"    Role:     admin")
print(f"    Name:     Admin")
print(f"    Fullname: مدیر سیستم")
