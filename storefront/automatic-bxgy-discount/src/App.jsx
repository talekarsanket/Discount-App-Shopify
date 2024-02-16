import socket from './socket'
import './App.css'
import { useEffect } from 'react'

function App() {
  console.log("******************My extension is finally connected**************************** ");

  useEffect(() => {
    socket.on("disconnect", (socket) => {
      console.log("extension disconnect ------- :", socket?.id);
    });

    socket.on("connection", (socket) => {
      console.log("extension connected ------- :", socket?.id);
    });

    socket.on("connect_error", (err) => {
      console.log(`connect_error due to ${err.message}`);
    });

    socket.on("addDiscountProduct", async (payload) => {
      console.log("Paylaod-Dataaaaaaaaaaaa==============", payload);

      try {
        const fetchData = await fetch(`https://${Shopify.shop}/cart/add.js`, {
          method: "POST",
          headers: {
            "Content-type": "application/json"
          },
          body: JSON.stringify({
            "id": payload.productID,
            "quantity": 1
          }),
        });
        console.log("fetchData ====", fetchData);
        const response = await fetchData.json();
        console.log("response =====", response);
        window.location.reload();
      } catch (error) {
        console.log("error in cart api ===", error);
      }
    });

    socket.emit("checkExtension", { data: "hello from client Side" });
  }, [socket]);

  return (
    <>
    </>
  )
}

export default App
