from sqlalchemy.orm import Session

from app.repositories.expense_repository import ExpenseRepository
from app.schemas.expense import ExpenseCreate


class ExpenseService:
    """Application service for expense workflows.

    Keep orchestration logic here so future AI flows (e.g. receipt parsing)
    can compose repository operations without leaking persistence details to API.
    """

    def __init__(self, db: Session):
        self.repository = ExpenseRepository(db)

    def list_expenses(self):
        return self.repository.list_expenses()

    def create_expense(self, payload: ExpenseCreate):
        return self.repository.create_expense(payload)
