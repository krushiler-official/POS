const WS_URL = 'ws://localhost:8000/ws/orders'

class OrderSocket {
  constructor() {
    this.ws = null
    this.listeners = new Set()
    this.shouldReconnect = true
    this.reconnectDelay = 3000
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return
    this.ws = new WebSocket(WS_URL)

    this.ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        this.listeners.forEach((fn) => fn(msg))
      } catch {}
    }

    this.ws.onclose = () => {
      if (this.shouldReconnect) {
        setTimeout(() => this.connect(), this.reconnectDelay)
      }
    }

    this.ws.onerror = () => {
      this.ws?.close()
    }
  }

  subscribe(fn) {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  disconnect() {
    this.shouldReconnect = false
    this.ws?.close()
  }
}

export const orderSocket = new OrderSocket()
