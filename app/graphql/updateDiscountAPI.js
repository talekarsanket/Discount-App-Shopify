import productDetails from "../Database/productDetails";

export const updateDiscount = async (graphql, data) => {
  try {
    let {
      BuyProduct,
      GetProduct,
      discountPercent,
      offerTitle,
      endDate,
      offerId,
      selectOffer,
    } = data;
    // console.log("data =====", data);

    const findProductToUpdate = await productDetails.findOne({
      OfferId: offerId,
    });

    if (findProductToUpdate) {
      let startDate = new Date(findProductToUpdate.OfferStartDate);

      let endDateString = new Date(endDate);
      if (
        new Date(endDate).toISOString() !==
        new Date(findProductToUpdate.OfferEndDate).toISOString()
      ) {
        endDateString.setDate(endDateString.getDate() + 1);
        // console.log("endDateString11111 ============", endDateString);
      }

      const { buyProduct, getProduct } = findProductToUpdate;
      // ========================  product add or remove ======================//
      let updateBuyProduct;
      if (buyProduct.productID !== BuyProduct.productID) {
        updateBuyProduct = {
          items: {
            products: {
              productsToAdd: [`${BuyProduct.productID}`],
              productsToRemove: [`${buyProduct.productID}`],
            },
          },
        };
      } else {
        updateBuyProduct = {
          items: {
            products: {
              productsToAdd: [`${BuyProduct.productID}`],
            },
          },
        };
      }

      let updateGetProduct;
      if (getProduct.productId !== GetProduct.productID) {
        updateGetProduct = {
          items: {
            products: {
              productsToAdd: [`${GetProduct.productID}`],
              productsToRemove: [`${getProduct.productId}`],
            },
          },
        };
      } else {
        updateGetProduct = {
          items: {
            products: {
              productsToAdd: [`${GetProduct.productID}`],
            },
          },
        };
      }

      // ========================== set amount in percentage ========================//
      let customersGetsQuery;
      if (selectOffer === "Percent") {
        console.log("percent");
        customersGetsQuery = {
          discountOnQuantity: {
            quantity: "1",
            effect: {
              percentage: Number(discountPercent) / 100,
            },
          },
        };
      } else {
        console.log("amount");
        customersGetsQuery = {
          discountOnQuantity: {
            quantity: "1",
            effect: {
              percentage: Number(discountPercent) / Number(GetProduct.price),
            },
          },
        };
      }

      // ======================== API to update discount ============================//
      const response = await graphql(
        `
          mutation discountAutomaticBxgyUpdate(
            $automaticBxgyDiscount: DiscountAutomaticBxgyInput!
            $id: ID!
          ) {
            discountAutomaticBxgyUpdate(
              automaticBxgyDiscount: $automaticBxgyDiscount
              id: $id
            ) {
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
        {
          variables: {
            automaticBxgyDiscount: {
              usesPerOrderLimit: "1",
              startsAt: startDate,
              endsAt: endDate ? endDateString : null,
              title: offerTitle,
              customerGets: {
                value: {
                  ...customersGetsQuery,
                },
                ...updateGetProduct,
              },
              customerBuys: {
                value: {
                  quantity: "1",
                },
                ...updateBuyProduct,
              },
            },
            id: `gid://shopify/DiscountAutomaticNode/${offerId}`,
          },
        }
      );

      const dataAPI = await response.json();
      const updateResponse =
        dataAPI.data.discountAutomaticBxgyUpdate.automaticDiscountNode;

      const error = dataAPI?.data?.discountAutomaticBxgyUpdate?.userErrors[0];

      if (updateResponse) {
        // console.log("updateResponse ========", updateResponse);

        let updateEndDate = dataAPI.data.discountAutomaticBxgyUpdate.automaticDiscountNode.automaticDiscount.endsAt

        const splitOfferId = updateResponse.id.split("/")[4];
        // console.log("splitOfferId ============", splitOfferId);

        let updatDatabaseOffer = await productDetails.findOneAndUpdate(
          { OfferId: splitOfferId },
          {
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
            offerType: selectOffer,
            OfferStartDate: startDate,
            OfferEndDate: endDate
              ? new Date(updateEndDate).toISOString()
              : null,
            isActive:
              endDate === null || new Date(endDateString) >= new Date()
                ? "Active"
                : "Expired",
          }
        );
        return {
          updateData: updatDatabaseOffer,
          status: 201,
        };
      } else if (error) {
        console.log("error ===============", error);
        return {
          data: error.code,
          status: 205,
          message: error.message,
        };
      }
    }
  } catch (error) {
    console.log("error in update route", error.message);
    return {
      status: 404,
      message: error.message,
    };
  }
};
