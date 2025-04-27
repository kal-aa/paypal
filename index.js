import dotenv from "dotenv";
import express from "express";
import { capturePayment, createOrder } from "./services/paypal.js";

const app = express();
dotenv.config();

app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("index");
});

app.post("/pay", async (req, res) => {
  try {
    const url = await createOrder();
    res.redirect(url);
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
