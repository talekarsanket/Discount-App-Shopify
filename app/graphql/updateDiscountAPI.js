import productDetails from "../Database/productDetails";

export const updateDiscount = async (graphql, data, shop) => {
  try {
    let {
      BuyProduct,
      GetProduct,
      discountPercent,
      offerTitle,
      startDate,
      endDate,
      offerId,
      selectOffer,
    } = data;
    console.log("data =====", data);
    console.log("startDate ===", startDate);

    if (endDate) {
      endDate = new Date(endDate);
      endDate.setDate(endDate.getDate() + 1);
    }
    // console.log("endDate =========", new Date(endDate));

    const findProducts = await productDetails.findOne({ OfferId: offerId });
    // console.log("findProducts ================", findProducts);

    const { buyProduct, getProduct } = findProducts;

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
    // console.log("updatebuyProduct=======", { ...updateBuyProduct });

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

    try {
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
              endsAt: endDate ? endDate : null,
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
      // console.log("updateResponse ========", updateResponse);

      if (updateResponse) {
        let updatDatabaseOffer = await productDetails.findOneAndUpdate(
          { OfferId: offerId },
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
            OfferEndDate: endDate ? new Date(endDate).toISOString() : null,
            isActive:
              endDate === null || endDate >= new Date() ? "Active" : "Expired",
          }
        );
        // console.log("updatDatabaseOffer ==", updatDatabaseOffer);

        return {
          updateData: updatDatabaseOffer,
          status: 201,
        };
      }

      const errors = dataAPI.data.discountAutomaticBxgyUpdate.userErrors;
      console.log("error", errors);
      if (errors) {
        return {
          data: errors[0].code,
          status: 205,
          message: errors[0].message,
        };
      }
    } catch (error) {
      console.log("error in update route", error);
      return error;
    }
    return true;
  } catch (error) {
    console.log("error ===", error);
    return error;
  }
};
