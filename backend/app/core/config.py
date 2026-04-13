from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="DELTA_SPEND_", extra="ignore")

    app_name: str = "Delta Spend API"
    api_prefix: str = "/api/v1"
    database_url: str = "sqlite:///./delta_spend.db"

    default_rate_limit: str = "60/minute"
    read_expenses_rate_limit: str = "30/minute"
    create_expense_rate_limit: str = "10/minute"


settings = Settings()
