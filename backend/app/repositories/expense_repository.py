from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.expense import Expense
from app.schemas.expense import ExpenseCreate


class ExpenseRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_expenses(self) -> list[Expense]:
        stmt = select(Expense).order_by(Expense.occurred_on.desc(), Expense.id.desc())
        return list(self.db.scalars(stmt).all())

    def create_expense(self, payload: ExpenseCreate) -> Expense:
        expense = Expense(**payload.model_dump())
        self.db.add(expense)
        self.db.commit()
        self.db.refresh(expense)
        return expense
