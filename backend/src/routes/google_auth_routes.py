from fastapi import APIRouter,Depends,HTTPException
from google.oauth2 import id_token
from google.auth.transport.requests import Request
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv
from src.schemas.user import GoogleToken
from src.core.database import get_db
from src.utils.security import create_access_token
from src.models.user import User
load_dotenv()
router= APIRouter(prefix="/auth", tags=["Google Auth"])

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

@router.post("/google_auth")
def google_login(data: GoogleToken, db: Session = Depends(get_db)):
    try:
        idinfo = id_token.verify_oauth2_token(
            data.token,
            Request(),
            GOOGLE_CLIENT_ID
        )

        email = idinfo["email"]
        name = idinfo["name"]

    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Google token")

    # Check if user exists
    user = db.query(User).filter(User.email == email).first()

    if not user:
        user = User(
            name=name,
            email=email,
            password="", 
            is_verified=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Create JWT
    access_token = create_access_token({"sub": user.email})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "email": user.email,
            "name": user.name
        }
    }