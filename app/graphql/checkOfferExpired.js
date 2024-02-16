import productDetails from "../Database/productDetails";

async function checkOfferExpired() {
  console.log("checkOfferExpired is log");

  const offers = await productDetails.find();
  // console.log("offers ====", offers);

  const CurrentDate = new Date();

  for (const offer of offers) {
    if (
      offer.OfferEndDate === null ||
      new Date(offer.OfferEndDate) >= CurrentDate
    ) {
      offer.isActive = "Active";
    } else {
      offer.isActive = "Expired";
    }
    await offer.save();
  }
}

export default checkOfferExpired;
