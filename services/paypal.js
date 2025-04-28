import dotenv from "dotenv";
dotenv.config();

let accessToken = null;
let accessTokenExpiry = null;

async function generateAccessToken() {
  if (accessToken && accessTokenExpiry > Date.now()) {
    return accessToken;
  }

  const url = `${process.env.PAYPAL_BASE_URL}/v1/oauth2/token`;

  const body = new URLSearchParams();
  body.append("grant_type", "client_credentials");

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization: `Basic ${Buffer.from(
      `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`
    ).toString("base64")}`,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: body.toString(),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    accessToken = data.access_token;
    // Date.now() in miliseconds + expires_in in seconds * 1000 to convert to milliseconds
    accessTokenExpiry = Date.now() + data.expires_in * 1000;
    return data.access_token;
  } catch (error) {
    console.error("Error generating access token:", error);
  }
}

export const createOrder = async (orders) => {
  const accessToken = await generateAccessToken();
  const url = `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders`;

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };

  const purchase_units = orders.map((order, index) => ({
    reference_id: `order_${index + 1}`,
    items: [
      {
        name: order.name,
        description: order.description,
        quantity: "1",
        unit_amount: {
          currency_code: "USD",
          value: order.price.toFixed(2),
        },
      },
    ],
    amount: {
      currency_code: "USD",
      value: order.price.toFixed(2),
      breakdown: {
        item_total: {
          currency_code: "USD",
          value: order.price.toFixed(2),
        },
      },
    },
  }));

  const body = JSON.stringify({
    intent: "CAPTURE",
    purchase_units,
    application_context: {
      return_url: `${process.env.BASE_URL}/complete-order`,
      cancel_url: `${process.env.BASE_URL}/cancel-order`,
      shipping_preference: "NO_SHIPPING",
      user_action: "PAY_NOW",
      brand_name: "kal-commerce",
    },
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
    });

    if (!response.ok) {
      const result = await response.json();
      console.error("Error creating order:", result);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.links.find((link) => link.rel === "approve").href;
  } catch (error) {
    console.error("Error creating order:", error);
  }
};

export const capturePayment = async (orderId) => {
  const accessToken = await generateAccessToken();
  const url = `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };

  const response = await fetch(url, {
    method: "POST",
    headers,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data;
};
