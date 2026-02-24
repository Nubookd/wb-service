require("dotenv").config();
const post = async () => {
  try {
    // const today = new Date().toISOString().split('T')[0];
    const today = new Date('2026-02-22').toISOString().split('T')[0];
    console.log(today)
    const res = await fetch(`https://common-api.wildberries.ru/api/v1/tariffs/box?date=${today}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.WB_API_TOKEN}`,
      },
    });

    const data = await res.json()
    console.log(data.response.data.dtTillMax)
  } catch (error) {
    console.log('фиаско')
  }
};

post();
