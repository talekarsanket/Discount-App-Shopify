import productDetails from "../Database/productDetails";
import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  try {
    const offerId = await request.json();
    // console.log("deactivate discount id =========", offerId);

    const { admin } = await authenticate.admin(request);

    const response = await admin.graphql(
      `mutation discountAutomaticDeactivate($id: ID!) {
        discountAutomaticDeactivate(id: $id) {
          automaticDiscountNode {
            automaticDiscount {
              ... on DiscountAutomaticBxgy {
                status
                startsAt
                endsAt
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          id: `gid://shopify/DiscountAutomaticNode/${offerId}`,
        },
      }
    );

    const data = await response.json();
    const automaticDiscount =
      data.data.discountAutomaticDeactivate.automaticDiscountNode;
    // console.log("automaticDiscount ======", automaticDiscount);

    const userErrors = data.data.discountAutomaticDeactivate.userErrors[0];
    // console.log("userErrors ======", userErrors);

    if (automaticDiscount) {
      const updateStatusinDb = await productDetails.findOneAndUpdate(
        { OfferId: offerId },
        {
          isActive: "Expired",
        }
      );
      // console.log("updateStatusinDb ===", updateStatusinDb);
      return {
        message: "Offer Deactivated",
        status: 200,
      };
    } else if (userErrors) {
      return {
        message: userErrors.message,
        status: 201,
      };
    }
  } catch (error) {
    console.error("Error in deactivate api", error);
    return {
      message: "Internal Server Error",
      status: 500,
    };
  }
};
