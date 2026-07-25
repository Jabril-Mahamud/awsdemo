import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)

    # One feature request per user (enforced by the unique author_id below).
    request: Mapped["FeatureRequest | None"] = relationship(
        back_populates="author", cascade="all, delete-orphan", uselist=False
    )
    votes: Mapped[list["Vote"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class FeatureRequest(Base):
    __tablename__ = "feature_requests"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # unique -> a user can only ever own one request.
    author_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False
    )
    title: Mapped[str] = mapped_column(String(140), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    author: Mapped["User"] = relationship(back_populates="request")
    votes: Mapped[list["Vote"]] = relationship(
        back_populates="request", cascade="all, delete-orphan"
    )


class Vote(Base):
    __tablename__ = "votes"
    # One vote per user per request; budgets (3 up / 2 down) are enforced in the route.
    __table_args__ = (UniqueConstraint("user_id", "request_id", name="uq_user_request_vote"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    request_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("feature_requests.id"), nullable=False
    )
    value: Mapped[int] = mapped_column(Integer, nullable=False)  # +1 up, -1 down

    user: Mapped["User"] = relationship(back_populates="votes")
    request: Mapped["FeatureRequest"] = relationship(back_populates="votes")
