from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import connect_db, close_db
from app.routes import auth, tables, products, orders, kitchen, analytics
from app.websockets.manager import manager

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()

app = FastAPI(title="POS Cafe API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(tables.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(kitchen.router)
app.include_router(analytics.router)

@app.websocket("/ws/orders")
async def websocket_orders(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/")
def root():
    return {"message": "POS Cafe API v2.0 is running"}
