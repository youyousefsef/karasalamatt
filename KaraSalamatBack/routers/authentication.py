import os
import secrets
import uuid
import hmac
import hashlib
from datetime import datetime, timezone, timedelta
from enum import Enum
from typing import Annotated, List
import httpx
from fastapi import APIRouter, Depends, HTTPException, status, Path, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from pydantic import BaseModel, constr, Field
from database import SessionLocal
from models import User, VerfyOTPCode, AdminReg, HSEReg, HSEData
from dotenv import load_dotenv
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

router = APIRouter(
    prefix='/auth',
    tags=['auth']
)
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("No SECRET_KEY set for application")

ALGORITHM = 'HS256'
bearer_scheme = HTTPBearer(auto_error=True)

ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
OTP_EXP_DAYS = int(os.getenv("OTP_EXP_DAYS", "30"))

class RoleE(str, Enum):
    HSESupervisor = "HSESupervisor"

class HSERegOut(BaseModel):
    id: int
    phone_num: str
    role: str
    owner_id: int

    model_config = {"from_attributes": True}


class CreateUserRequest(BaseModel):
    name: str
    fullname: str
    phone_number: constr(pattern=r"^09\d{9}$")
    otp_code: str

class VerifyOTPRequest(BaseModel):
    phone_number: constr(pattern=r"^09\d{9}$")

class AddRole(BaseModel):
    phone_number: str
    role: RoleE

class HSEMetricE(str, Enum):
    sound = "صدا"
    light = "نور"
    dust = "غبار هوا"
    heat = "گرما"

class HSEDataCreate(BaseModel):
    metric: HSEMetricE
    value: str = Field(..., min_length=1)

class HSEDataOut(BaseModel):
    id: int
    supervisor_id: int
    metric: str
    value: str
    created_at: datetime | None = None

    model_config = {"from_attributes": True}

class HSEDataUpdate(BaseModel):
    value: str = Field(..., min_length=1)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]

def hash_otp(otp: str) -> str:
    return hmac.new(
        SECRET_KEY.encode(), otp.encode(), hashlib.sha256
    ).hexdigest()

def verify_otp(stored_hash: str, input_otp: str) -> bool:
    return hmac.compare_digest(stored_hash, hash_otp(input_otp))

def generate_otp(length: int = 4) -> str:
    digits = "0123456789"
    gen= "".join(secrets.choice(digits) for _ in range(length))
    return gen

def authenticate_user(phone_number: str, db):
    user = db.query(User).filter(User.phone_number == phone_number).first()
    if not user:
        return False
    return user

def create_access_token(phone_number: str, user_id: int, role: str, subb: int, expires_delta: timedelta):
    now = datetime.now(timezone.utc)
    encode = {
        'sub': phone_number,
        'id': user_id,
        'role': role,
        'subb': subb,
        'iat': now,
        'jti': uuid.uuid4().hex,
    }
    expires = now + expires_delta
    encode.update({'exp': expires})
    return jwt.encode(encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(phone_number: str, user_id: int) -> str:
    now = datetime.now(timezone.utc)
    encode = {
        'sub': phone_number,
        'id': user_id,
        'type': 'refresh',
        'iat': now,
        'jti': uuid.uuid4().hex,
    }
    expires = now + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    encode.update({'exp': expires})
    return jwt.encode(encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)]):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        phone_number: str = payload.get('sub')
        subb: int = payload.get('subb')
        user_id: int = payload.get('id')
        user_role: str = payload.get('role')

        if phone_number is None or user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail='Could not validate user.'
            )

        return {
            'phone_number': phone_number,
            'id': user_id,
            'user_role': user_role,
            'subb': subb,
        }

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Could not validate user.'
        )


@router.post("/generate-otp")
@limiter.limit("5/minute")
async def generate_otp_endpoint(
    request: Request,
    body: VerifyOTPRequest,
    db: db_dependency,
):
    HSE_check = db.query(HSEReg).filter(HSEReg.phone_num == body.phone_number).first()
    admin_check = db.query(AdminReg).filter(AdminReg.phone_num == body.phone_number).first()

    if not HSE_check and not admin_check:
        raise HTTPException(status_code=404, detail="Not Found")

    last_otp = (
        db.query(VerfyOTPCode)
        .filter(VerfyOTPCode.phone_number == body.phone_number)
        .order_by(VerfyOTPCode.created_at.desc())
        .first()
    )

    cooldown_seconds = 110

    if last_otp:
        now_utc = datetime.now(timezone.utc)
        created_at = last_otp.created_at
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        age_seconds = (now_utc - created_at).total_seconds()

        if age_seconds < cooldown_seconds:
            remaining = int(cooldown_seconds - age_seconds)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"OTP already sent recently. Try again in {remaining} seconds.",
            )
        else:
            db.delete(last_otp)
            db.commit()

    otp_code = "1111"

    otp_record = VerfyOTPCode(
        phone_number=body.phone_number,
        otp_code=hash_otp(otp_code)
    )
    db.add(otp_record)
    db.commit()
    db.refresh(otp_record)

    toNum = body.phone_number.replace("+98", "0")
    # params = {
    #     "username": f"{YOUR_USERNAME}",
    #     "password": f"{YOUR_API_KEY}",
    #     "pid": f"{PID_CODE}",
    #     "fnum": "90008361",
    #     "tnum": toNum,
    #     "p1": "code",
    #     "v1": otp_code,
    # }
    try:
        if os.getenv("OTP_MOCK", "true").lower() == "true":
            print(f"[DEV] OTP for {body.phone_number}: {otp_code}", flush=True)
            return {
                "ok": True,
                "message": "OTP generated (DEV MODE - printed to console)",
                "phone_number": body.phone_number,
                "expires_in": cooldown_seconds,
            }
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://legacy-support.farazsms.com/patterns/pattern",
                params={
                    "fnum": os.getenv("SMS_FNUM", ""),
                    "tnum": toNum,
                    "p1": "code",
                    "v1": otp_code,
                },
            )
            return {
                "ok": True,
                "provider_status": response.text,
                "message": "OTP generated successfully",
                "phone_number": body.phone_number,
                "expires_in": cooldown_seconds,
            }
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"SMS provider error: {e}")


@router.post("/verify-otp-and-create-user")
@limiter.limit("10/minute")
def verify_otp_and_create_user(
    request: Request,
    body: CreateUserRequest,
    db: db_dependency,
):
    otp_record = db.query(VerfyOTPCode).filter(VerfyOTPCode.phone_number == body.phone_number).first()

    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="کد اشتباه است یا منقضی شده.\n درصورت عدم دریافت کد، درخواست مجدد بدهید.",
        )

    if not verify_otp(str(otp_record.otp_code), str(body.otp_code)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="کد وارد شده نادرست میباشد",
        )

    ttl_seconds = 110
    now_utc = datetime.now(timezone.utc)
    created_at = otp_record.created_at
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)

    diff = (now_utc - created_at).total_seconds()

    if diff > ttl_seconds:
        db.delete(otp_record)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="این کد منقضی شده، کد جدید دریافت کنید",
        )

    sel_role = "user"
    user_sub = ""
    HSE_check = db.query(HSEReg).filter(HSEReg.phone_num == body.phone_number).first()
    admin_check = db.query(AdminReg).filter(AdminReg.phone_num == body.phone_number).first()

    if admin_check:
        sel_role = "admin"
        user_sub = db.query(AdminReg.id).filter(AdminReg.phone_num == body.phone_number).scalar()
    elif HSE_check:
        sel_role = db.query(HSEReg.role).filter(HSEReg.phone_num == body.phone_number).scalar()
        user_sub = db.query(HSEReg.owner_id).filter(HSEReg.phone_num == body.phone_number).scalar()
    else:
        raise HTTPException(status_code=404, detail="Not Found")

    existing_user = db.query(User).filter(
        User.phone_number == body.phone_number
    ).first()

    if not existing_user:
        create_user_model = User(
            name=body.name,
            fullname=body.fullname,
            phone_number=body.phone_number,
            role=sel_role,
            sub=user_sub,
        )
        db.add(create_user_model)
        db.delete(otp_record)
        db.commit()
        db.refresh(create_user_model)
        user = authenticate_user(body.phone_number, db)

        access_token = create_access_token(
            user.phone_number,
            user.id,
            user.role,
            user.sub,
            timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        )
        refresh_token = create_refresh_token(
            user.phone_number,
            user.id,
        )

        return {
            "role": sel_role,
            "phone_number": create_user_model.phone_number,
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        }

    else:
        db.delete(otp_record)
        db.commit()

        user = authenticate_user(body.phone_number, db)
        access_token = create_access_token(
            user.phone_number,
            user.id,
            user.role,
            user.sub,
            timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        )
        refresh_token = create_refresh_token(
            user.phone_number,
            user.id,
        )

        return {
            "role": sel_role,
            "phone_number": user.phone_number,
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        }

class RefreshTokenRequest(BaseModel):
    refresh_token: str


@router.post("/refresh")
def refresh_token(body: RefreshTokenRequest, db: db_dependency):
    try:
        payload = jwt.decode(body.refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token")

        phone_number: str = payload.get('sub')
        user_id: int = payload.get('id')

        if not phone_number or not user_id:
            raise HTTPException(status_code=401, detail="Invalid refresh token")

        user = db.query(User).filter(User.id == user_id, User.phone_number == phone_number).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        access_token = create_access_token(
            user.phone_number,
            user.id,
            user.role,
            user.sub or 0,
            timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        )
        new_refresh_token = create_refresh_token(
            user.phone_number,
            user.id,
        )

        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
        }

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")


user_dependency = Annotated[dict, Depends(get_current_user)]

@router.get("/me")
def get_current_user_info(user: user_dependency, db: db_dependency):
    user_id = user.get("id")
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": db_user.id,
        "phone_number": db_user.phone_number,
        "role": db_user.role,
        "name": db_user.name,
        "fullname": db_user.fullname,
        "created_at": db_user.created_at.isoformat() if db_user.created_at else None,
    }


@router.post("/add-supervisor")
def add_supervisor(
    body: AddRole,
    user: user_dependency,
    db: db_dependency,
):
    user_role = user.get("user_role")
    if user_role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin users can access this resource."
        )
    existed = db.query(HSEReg).filter(HSEReg.phone_num == body.phone_number).first()
    if existed:
        raise HTTPException(status_code=400, detail="User already exists.")

    user_id = user.get("id")
    create_supervisor_model = HSEReg(
        phone_num=body.phone_number,
        role=body.role,
        owner_id=user_id
    )
    db.add(create_supervisor_model)
    db.commit()
    db.refresh(create_supervisor_model)

    return create_supervisor_model

@router.get("/get_all_supervisors")
async def read_all(
    user: user_dependency,
    db: db_dependency,
    skip: int = 0,
    limit: int = 50,
):
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')

    user_role = user.get("user_role")
    if user_role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin users can access this resource."
        )
    return (
        db.query(HSEReg)
        .filter(HSEReg.owner_id == user.get('id'))
        .offset(skip)
        .limit(limit)
        .all()
    )

@router.delete("/delete_sup/{sup_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_db(user:user_dependency, db: db_dependency, sup_id: int = Path(gt=0)):
    if user is None:
        raise HTTPException(status_code=401, detail="First login.")
    user_role = user.get("user_role")
    if user_role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin users can access this resource."
        )

    patient_model = db.query(HSEReg).filter(HSEReg.id == sup_id).filter(HSEReg.owner_id == user.get('id')).first()
    if patient_model is None:
        raise HTTPException(status_code=404, detail="Not found!")

    db.query(HSEReg).filter(HSEReg.id == sup_id).filter(HSEReg.owner_id == user.get('id')).delete()
    db.commit()


@router.post("/hse_data")
async def create_hse_data(
    payload: HSEDataCreate,
    user: user_dependency,
    db: db_dependency,
):
    user_role = user.get("user_role")
    if user_role != RoleE.HSESupervisor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="فقط ناظران HSE مجاز به ثبت داده هستند."
        )
    phone_number = user.get("phone_number")
    sup = db.query(HSEReg).filter(HSEReg.phone_num == phone_number).first()
    if not sup:
        raise HTTPException(status_code=404, detail="ناظر یافت نشد.")

    record = HSEData(
        supervisor_id=sup.id,
        metric=payload.metric.value,
        value=payload.value,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return HSEDataOut.model_validate(record)


@router.get("/hse_data")
async def list_hse_data(
    user: user_dependency,
    db: db_dependency,
    skip: int = 0,
    limit: int = 20,
):
    query = db.query(HSEData)
    user_role = user.get("user_role")
    if user_role != "admin":
        phone_number = user.get("phone_number")
        sup = db.query(HSEReg).filter(HSEReg.phone_num == phone_number).first()
        if sup:
            query = query.filter(HSEData.supervisor_id == sup.id)
        else:
            query = query.filter(False)
    else:
        admin_id = user.get("id")
        sup_ids = [s.id for s in db.query(HSEReg).filter(HSEReg.owner_id == admin_id).all()]
        query = query.filter(HSEData.supervisor_id.in_(sup_ids))

    rows = query.order_by(HSEData.created_at.desc()).offset(skip).limit(limit).all()
    return [HSEDataOut.model_validate(r) for r in rows]


@router.put("/hse_data/{entry_id}")
async def update_hse_data(
    entry_id: int,
    payload: HSEDataUpdate,
    user: user_dependency,
    db: db_dependency,
):
    user_role = user.get("user_role")
    if user_role != RoleE.HSESupervisor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="فقط ناظران HSE مجاز به ویرایش هستند."
        )
    phone_number = user.get("phone_number")
    sup = db.query(HSEReg).filter(HSEReg.phone_num == phone_number).first()
    if not sup:
        raise HTTPException(status_code=404, detail="ناظر یافت نشد.")

    entry = db.query(HSEData).filter(
        HSEData.id == entry_id,
        HSEData.supervisor_id == sup.id,
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="داده یافت نشد یا متعلق به شما نیست.")

    entry.value = payload.value
    db.commit()
    db.refresh(entry)
    return HSEDataOut.model_validate(entry)


@router.delete("/hse_data/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_hse_data(
    entry_id: int,
    user: user_dependency,
    db: db_dependency,
):
    user_role = user.get("user_role")
    if user_role != RoleE.HSESupervisor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="فقط ناظران HSE مجاز به حذف هستند."
        )
    phone_number = user.get("phone_number")
    sup = db.query(HSEReg).filter(HSEReg.phone_num == phone_number).first()
    if not sup:
        raise HTTPException(status_code=404, detail="ناظر یافت نشد.")

    entry = db.query(HSEData).filter(
        HSEData.id == entry_id,
        HSEData.supervisor_id == sup.id,
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="داده یافت نشد یا متعلق به شما نیست.")
    db.delete(entry)
    db.commit()


