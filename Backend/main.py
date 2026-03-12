from App.menu import app
from App.database import init_database
from App.routes.contestacao import router as contestacao_router

# Prefix organizado para API backend.
app.include_router(contestacao_router, prefix="/api", tags=["Contestacao"])

# Garante estrutura minima ao iniciar o backend.
init_database()
