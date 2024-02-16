import { authenticate } from "../shopify.server";
import db from "../db.server";
import productDetails from "../Database/productDetails"
import { socketConnected } from "../entry.server";
import { productDeleteCheck } from "../graphql/productDelete";
// import { socketConnected } from "../entry.server";


export const action = async ({ request }) => {
  const { topic, shop, session, admin, payload } = await authenticate.webhook(
    request
  );

  if (!admin) {
    // The admin context isn't returned if the webhook fired after a shop was uninstalled.
    throw new Response();
  }

  switch (topic) {
    case "APP_UNINSTALLED":
      if (session) {
        await db.session.deleteMany({ where: { shop } });
      }
      break;

    case "CARTS_UPDATE":
      console.log("********************CARTS_UPDATE WEBHOOK CALL*******************");
      console.log("payload ======", payload.line_items);
      let filterArray = []
      let totalDiscount = 0
      for (let item of payload.line_items) {
        filterArray.push(item.variant_id)
        totalDiscount += Number(item.total_discount)
      }
      console.log("filterArray ===", filterArray);

      if (totalDiscount !== 0) {
        return null
      } else {
        let ruleArray = [];
        for (let variant of filterArray) {
          console.log("Varienttt ====", variant);
          const ruleObj = await productDetails.find({ "buyProduct.productVarientId": `gid://shopify/ProductVariant/${variant}` });
          console.log("ruleObj ===", ruleObj);

          const checkActiveCoupon = ruleObj.filter((ele) => {
            return ele.isActive === "Active";
          });
          console.log("checkActiveCoupon ==============", checkActiveCoupon);

          let maxOfferDiscount = checkActiveCoupon[0];
          if (!checkActiveCoupon.length) {
            console.log("========= Order not found on this Product =============")
          }
          else if (checkActiveCoupon.length === 1) {
            ruleArray.push(checkActiveCoupon[0]);
          }
          else if (checkActiveCoupon.length > 1) {
            for (let items of checkActiveCoupon) {
              if (maxOfferDiscount.DiscountInPercent < items.DiscountInPercent) {
                console.log("==============insidw third condition ===============");
                maxOfferDiscount = items
              }
            }
            ruleArray.push(maxOfferDiscount);
          }
          console.log("ruleArray =====", ruleArray);

          if (ruleArray.length) {
            let getProductId = ruleArray[0]?.getProduct.productVarientId
            console.log("getproduct =========", getProductId);
            const splitProductId = getProductId.split("/")[4];
            console.log("splitProductId ===========", splitProductId);
            ruleArray.length && socketConnected.emit("addDiscountProduct", { "productID": splitProductId });
          }
        }
      }
      break;

    case "PRODUCTS_DELETE":
      console.log("PRODUCTS_DELETE ======", payload);
      productDeleteCheck(payload.id, admin, session);
      break;

    case "CUSTOMERS_DATA_REQUEST":
    case "CUSTOMERS_REDACT":
    case "SHOP_REDACT":
    default:
      throw new Response("Unhandled webhook topic", { status: 404 });
  }
  throw new Response();
};

