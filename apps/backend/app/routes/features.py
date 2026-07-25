import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.auth import get_current_user_id
from app.database import async_session
from app.models import FeatureRequest, Vote

router = APIRouter(prefix="/api/features", tags=["features"])

UPVOTE_BUDGET = 3
DOWNVOTE_BUDGET = 2


class FeatureCreate(BaseModel):
    title: str
    description: str | None = None


class VoteRequest(BaseModel):
    value: int  # 1 up, -1 down, 0 clears the vote


class FeatureResponse(BaseModel):
    id: str
    title: str
    description: str | None
    author: str
    score: int
    upvotes: int
    downvotes: int
    created_at: str
    mine: bool
    my_vote: int  # -1, 0, or 1


class BoardResponse(BaseModel):
    features: list[FeatureResponse]
    upvotes_remaining: int
    downvotes_remaining: int
    has_request: bool


def _budget(votes: list[Vote]) -> tuple[int, int]:
    """Remaining (up, down) budget for a user given all their votes."""
    up = sum(1 for v in votes if v.value > 0)
    down = sum(1 for v in votes if v.value < 0)
    return UPVOTE_BUDGET - up, DOWNVOTE_BUDGET - down


async def _board(session, user_id: uuid.UUID) -> BoardResponse:
    result = await session.execute(
        select(FeatureRequest)
        .options(selectinload(FeatureRequest.votes), selectinload(FeatureRequest.author))
        .order_by(FeatureRequest.created_at.desc())
    )
    requests = result.scalars().all()

    my_votes = await session.execute(select(Vote).where(Vote.user_id == user_id))
    my_votes = my_votes.scalars().all()
    my_vote_by_request = {v.request_id: v.value for v in my_votes}
    up_left, down_left = _budget(my_votes)

    features = []
    has_request = False
    for r in requests:
        up = sum(1 for v in r.votes if v.value > 0)
        down = sum(1 for v in r.votes if v.value < 0)
        mine = r.author_id == user_id
        has_request = has_request or mine
        # Sort by score desc within the recency order would need a resort; keep it
        # simple and sort the final list by score.
        features.append(
            FeatureResponse(
                id=str(r.id),
                title=r.title,
                description=r.description,
                author=r.author.username,
                score=up - down,
                upvotes=up,
                downvotes=down,
                created_at=r.created_at.isoformat(),
                mine=mine,
                my_vote=my_vote_by_request.get(r.id, 0),
            )
        )
    features.sort(key=lambda f: f.score, reverse=True)
    return BoardResponse(
        features=features,
        upvotes_remaining=up_left,
        downvotes_remaining=down_left,
        has_request=has_request,
    )


@router.get("", response_model=BoardResponse)
async def list_features(user_id: str = Depends(get_current_user_id)) -> BoardResponse:
    async with async_session() as session:
        return await _board(session, uuid.UUID(user_id))


@router.post("", response_model=BoardResponse, status_code=status.HTTP_201_CREATED)
async def create_feature(
    body: FeatureCreate, user_id: str = Depends(get_current_user_id)
) -> BoardResponse:
    title = body.title.strip()
    if not title:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Title is required")
    uid = uuid.UUID(user_id)
    async with async_session() as session:
        existing = await session.execute(
            select(FeatureRequest).where(FeatureRequest.author_id == uid)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="You already submitted a feature request (one per person)",
            )
        session.add(
            FeatureRequest(
                id=uuid.uuid4(),
                author_id=uid,
                title=title[:140],
                description=(body.description or None),
            )
        )
        await session.commit()
        return await _board(session, uid)


@router.delete("/mine", response_model=BoardResponse)
async def delete_my_feature(user_id: str = Depends(get_current_user_id)) -> BoardResponse:
    uid = uuid.UUID(user_id)
    async with async_session() as session:
        result = await session.execute(
            select(FeatureRequest).where(FeatureRequest.author_id == uid)
        )
        request = result.scalar_one_or_none()
        if not request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="You have no feature request"
            )
        await session.delete(request)
        await session.commit()
        return await _board(session, uid)


@router.post("/{feature_id}/vote", response_model=BoardResponse)
async def cast_vote(
    feature_id: str, body: VoteRequest, user_id: str = Depends(get_current_user_id)
) -> BoardResponse:
    if body.value not in (-1, 0, 1):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="value must be -1, 0, 1"
        )
    uid = uuid.UUID(user_id)
    rid = uuid.UUID(feature_id)
    async with async_session() as session:
        request = await session.get(FeatureRequest, rid)
        if not request:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feature not found")

        my_votes = await session.execute(select(Vote).where(Vote.user_id == uid))
        my_votes = my_votes.scalars().all()
        current = next((v for v in my_votes if v.request_id == rid), None)

        # Budget check excludes the vote being replaced on this same request.
        others = [v for v in my_votes if v.request_id != rid]
        up_left, down_left = _budget(others)
        if body.value > 0 and up_left < 1:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="No upvotes left (3 max)"
            )
        if body.value < 0 and down_left < 1:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="No downvotes left (2 max)"
            )

        if body.value == 0:
            if current:
                await session.delete(current)
        elif current:
            current.value = body.value
        else:
            session.add(Vote(id=uuid.uuid4(), user_id=uid, request_id=rid, value=body.value))
        await session.commit()
        return await _board(session, uid)
