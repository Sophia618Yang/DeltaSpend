from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="DELTA_SPEND_", extra="ignore")

    app_name: str = "Delta Spend API"
    api_prefix: str = "/api/v1"
    database_url: str = "sqlite:///./delta_spend.db"

    default_rate_limit: str = "60/minute"
    read_expenses_rate_limit: str = "30/minute"
    create_expense_rate_limit: str = "10/minute"
    parse_receipt_rate_limit: str = "5/minute"

    allowed_receipt_image_types: str = "image/jpeg,image/png,image/webp"
    max_receipt_upload_size_mb: int = 10

    receipt_parser_provider: str = Field(default="mock", validation_alias="RECEIPT_PARSER_PROVIDER")
    gemini_api_key: str | None = Field(default=None, validation_alias="GEMINI_API_KEY")
    gemini_model: str = Field(default="gemini-2.5-flash", validation_alias="GEMINI_MODEL")


settings = Settings()
