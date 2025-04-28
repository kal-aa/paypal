import dotenv from "dotenv";
import express from "express";
import path from "path";
import { capturePayment, createOrder } from "./services/paypal.js";

dotenv.config();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const _dirname = path.resolve();
app.get("/", (req, res) => {
  res.sendFile(_dirname + "/index.html");
});

app.post("/pay", async (req, res) => {
  try {
    if (!req.body.orders) {
      return res.status(400).send("No orders found");
    }

    const url = await createOrder(req.body.orders);
    res.json({ url });
  } catch (error) {
    res.send("Error " + error);
  }
});

app.get("/complete-order", async (req, res) => {
  try {
    await capturePayment(req.query.token);
    res.send("Course purchased successfully!");
  } catch (error) {
    res.send("Error " + error);
  }
});

app.get("/cancel-order", (req, res) => {
  res.redirect("/");
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
