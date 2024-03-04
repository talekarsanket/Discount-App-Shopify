import shopifySession from "../Database/shopifySession";
import productDetails from "../Database/productDetails";
// import { authenticate } from "../shopify.server";
import axios from "axios";

export const action = async ({ request }) => {
  const result = await request.json();
  // console.log("result ================", result);
  const CurrentDate = new Date();

  try {
    let {
      BuyProduct,
      GetProduct,
      discountPercent,
      offerTitle,
      endDate,
      selectOffer,
    } = result;

    if (endDate) {
      endDate = new Date(endDate);
      endDate.setDate(endDate.getDate() + 1);
      // console.log("endDate =========", endDate);
    }

    const sessionObject = await shopifySession.find();

    // ========================== Check Discount Type ========================== //
    let customerGets;
    if (selectOffer === "Percent") {
      customerGets = {
        value: {
          discountOnQuantity: {
            quantity: "1",
            effect: {
              percentage: discountPercent / 100,
            },
          },
        },
      };
    } else {
      customerGets = {
        value: {
          discountOnQuantity: {
            quantity: "1",
            effect: {
              percentage: Number(discountPercent) / Number(GetProduct.price),
            },
          },
        },
      };
    }

    // ========================== Creating Discount ========================== //
    try {
      const response = await axios({
        url: "https://new-test-55-second.myshopify.com/admin/api/2023-07/graphql.json",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": sessionObject[0].accessToken,
        },
        data: {
          query: `mutation discountAutomaticBxgyCreate($automaticBxgyDiscount: DiscountAutomaticBxgyInput!) {
              discountAutomaticBxgyCreate(automaticBxgyDiscount: $automaticBxgyDiscount) {
                automaticDiscountNode {
                  id
                  automaticDiscount {
                    ... on DiscountAutomaticBxgy {

                      createdAt
                      startsAt
                      endsAt
                      status
                      summary
                      title
                      usesPerOrderLimit
                      customerGets {
                        items {
                          ... on DiscountProducts {
                            products(first: 2) {
                              nodes {
                                id
                              }
                            }
                          }
                        }
                        value {
                          ... on DiscountOnQuantity {
                            quantity {
                              quantity
                            }
                          }
                        }
                      }
                      customerBuys {
                        items {
                          ... on DiscountProducts {
                            products(first: 2) {
                              nodes {
                                id
                              }
                            }
                          }
                        }
                        value {
                          ... on DiscountQuantity {
                            quantity
                          }
                        }
                      }
                    }
                  }
                }
                userErrors {
                  field
                  code
                  message
                }
              }
            }
            `,
          variables: {
            automaticBxgyDiscount: {
              usesPerOrderLimit: "1",
              startsAt: new Date(),
              endsAt: endDate ? endDate : null,
              title: offerTitle,
              customerGets: {
                ...customerGets,
                items: {
                  products: {
                    productsToAdd: [`${BuyProduct.productID}`],
                  },
                },
              },
              customerBuys: {
                value: {
                  quantity: "1",
                },
                items: {
                  products: {
                    productsToAdd: [`${BuyProduct.productID}`],
                  },
                },
              },
            },
          },
        },
      });

      const data =
        response.data.data.discountAutomaticBxgyCreate.automaticDiscountNode;
      // console.log("data ==============", data);

      const error =
        response.data.data.discountAutomaticBxgyCreate.userErrors[0];
      // console.log("error ========", error);

      if (data) {
        let endsAt =
          response.data.data.discountAutomaticBxgyCreate.automaticDiscountNode
            .automaticDiscount.endsAt;

        let splitId = data.id.split("/")[4];

        // ======================== Save data in database ======================== //
        let saveOfferInDB = new productDetails({
          storeURL: sessionObject[0].shop,
          buyProduct: {
            productID: BuyProduct.productID,
            productTitle: BuyProduct.productTitle,
            productVarientId: BuyProduct.variantId,
            productPrice: BuyProduct.price,
          },
          getProduct: {
            productId: GetProduct.productID,
            productTitle: GetProduct.productTitle,
            productVarientId: GetProduct.variantId,
            productPrice: GetProduct.price,
          },
          DiscountInPercent: discountPercent,
          OfferTitle: offerTitle,
          OfferId: splitId,
          offerType: selectOffer,
          OfferStartDate: CurrentDate,
          OfferEndDate: endDate ? endsAt : null,
          isActive:
            new Date(endsAt) >= CurrentDate || endsAt === null
              ? "Active"
              : "Expired",
        });
        saveOfferInDB.save();

        return {
          data: saveOfferInDB,
          status: 201,
          message: "Offer save successfully",
        };
      } else if (error) {
        return {
          data: error.code,
          status: 205,
          message: error.message,
        };
      }
    } catch (error) {
      console.log("error in coupon api:", error);
      return {
        error: error.message,
        status: 404,
      };
    }
  } catch (error) {
    console.error("Error during loader execution:", error);
    return { error: error.message || "An error occurred" };
  }
};
