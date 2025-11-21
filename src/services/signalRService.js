import * as signalR from "@microsoft/signalr";

class SignalRService {
  constructor() {
    this.connection = null;
    this.isConnected = false;
  }

  // Initialize SignalR connection
  async startConnection() {
    if (this.connection && this.isConnected) {
      console.log("SignalR connection already established");
      return this.connection;
    }

    try {
      // Get token from localStorage
      const token = localStorage.getItem("token");
      
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl("http://localhost:5103/course/hubs/submission", {
          skipNegotiation: false,
          transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents | signalR.HttpTransportType.LongPolling,
          accessTokenFactory: () => token || "",
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            // Retry delays: 0s, 2s, 10s, 30s, then every 60s
            if (retryContext.previousRetryCount === 0) return 0;
            if (retryContext.previousRetryCount === 1) return 2000;
            if (retryContext.previousRetryCount === 2) return 10000;
            if (retryContext.previousRetryCount === 3) return 30000;
            return 60000;
          },
        })
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Connection event handlers
      this.connection.onclose((error) => {
        this.isConnected = false;
        console.log("SignalR connection closed", error);
      });

      this.connection.onreconnecting((error) => {
        this.isConnected = false;
        console.log("SignalR reconnecting...", error);
      });

      this.connection.onreconnected((connectionId) => {
        this.isConnected = true;
        console.log("SignalR reconnected. Connection ID:", connectionId);
      });

      await this.connection.start();
      this.isConnected = true;
      console.log("SignalR connection established. Connection ID:", this.connection.connectionId);
      
      return this.connection;
    } catch (error) {
      console.error("Error starting SignalR connection:", error);
      this.isConnected = false;
      throw error;
    }
  }

  // Stop SignalR connection
  async stopConnection() {
    if (this.connection) {
      try {
        await this.connection.stop();
        this.isConnected = false;
        console.log("SignalR connection stopped");
      } catch (error) {
        console.error("Error stopping SignalR connection:", error);
      }
    }
  }

  // Register event listener
  on(eventName, callback) {
    if (this.connection) {
      this.connection.on(eventName, callback);
    }
  }

  // Unregister event listener
  off(eventName, callback) {
    if (this.connection) {
      this.connection.off(eventName, callback);
    }
  }

  // Send message to server
  async invoke(methodName, ...args) {
    if (this.connection && this.isConnected) {
      try {
        return await this.connection.invoke(methodName, ...args);
      } catch (error) {
        console.error(`Error invoking ${methodName}:`, error);
        throw error;
      }
    } else {
      console.warn("SignalR connection is not established");
      throw new Error("SignalR connection is not established");
    }
  }

  // Get connection state
  getConnectionState() {
    if (!this.connection) return "Disconnected";
    
    switch (this.connection.state) {
      case signalR.HubConnectionState.Connected:
        return "Connected";
      case signalR.HubConnectionState.Connecting:
        return "Connecting";
      case signalR.HubConnectionState.Reconnecting:
        return "Reconnecting";
      case signalR.HubConnectionState.Disconnected:
        return "Disconnected";
      default:
        return "Unknown";
    }
  }

  // Check if connected
  isConnectionActive() {
    return this.isConnected && this.connection?.state === signalR.HubConnectionState.Connected;
  }
}

// Export singleton instance
const signalRService = new SignalRService();
export default signalRService;
